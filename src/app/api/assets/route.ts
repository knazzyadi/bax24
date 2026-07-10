// src/app/api/assets/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createAuditLog, AuditAction, buildAuditDTO } from '@/lib/audit-log';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '@/lib/assets/asset-errors';
import { parseAssetDates, getRoomHierarchy, validateDates } from '@/lib/assets/asset-utils';
import { createAssetWithRetry } from '@/lib/assets/asset-creator';

// ============================================
//  دالة مساعدة لاستخراج رسالة الخطأ
// ============================================
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// ============================================
//  GET - جلب الأصول
// ============================================
export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({
        assets: [],
        pagination: {
          total: 0,
          currentPage: 1,
          totalPages: 0,
          limit: 9999,
          nextUrl: null,
          prevUrl: null,
          currentCount: 0,
          startIndex: 0,
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const typeId = searchParams.get('typeId');
    const roomId = searchParams.get('roomId');
    const floorId = searchParams.get('floorId');
    const buildingId = searchParams.get('buildingId');
    const branchId = searchParams.get('branchId');
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '9999', 10);
    const skip = (page - 1) * limit;

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const userBranchIds = session.branchIds || [];
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json({
        assets: [],
        pagination: {
          total: 0,
          currentPage: 1,
          totalPages: 0,
          limit,
          nextUrl: null,
          prevUrl: null,
          currentCount: 0,
          startIndex: 0,
        },
      });
    }

    const where: Prisma.AssetWhereInput = {
      companyId,
      deletedAt: null,
    };

    if (!isAdmin) {
      if (userBranchIds.length > 0) {
        where.branchId = { in: userBranchIds };
      } else {
        return NextResponse.json({
          assets: [],
          pagination: {
            total: 0,
            currentPage: 1,
            totalPages: 0,
            limit,
            nextUrl: null,
            prevUrl: null,
            currentCount: 0,
            startIndex: 0,
          },
        });
      }
    }

    if (branchId) {
      if (isAdmin || userBranchIds.includes(branchId)) {
        where.branchId = branchId;
      } else {
        return NextResponse.json({
          assets: [],
          pagination: {
            total: 0,
            currentPage: 1,
            totalPages: 0,
            limit,
            nextUrl: null,
            prevUrl: null,
            currentCount: 0,
            startIndex: 0,
          },
        });
      }
    }

    if (buildingId) where.buildingId = buildingId;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { serialNumber: { contains: q, mode: 'insensitive' } },
        { manufacturer: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { supplier: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (typeId && typeId !== 'all') where.typeId = typeId;

    const effectiveRoomId = roomId;
    if (effectiveRoomId) {
      where.roomId = effectiveRoomId;
    } else if (floorId) {
      where.room = { floorId };
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          nameEn: true,
          description: true,
          purchaseDate: true,
          operationDate: true,
          warrantyEnd: true,
          lastMaintenanceDate: true,
          serialNumber: true,
          manufacturer: true,
          model: true,
          supplier: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          buildingId: true,
          branchId: true,
          type: { select: { id: true, name: true, nameEn: true, code: true } },
          status: { select: { id: true, name: true, nameEn: true, color: true } },
          room: { select: { id: true, name: true, nameEn: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    const serializedAssets = assets.map((asset) => ({
      ...asset,
      purchaseDate: asset.purchaseDate?.toISOString() || null,
      operationDate: asset.operationDate?.toISOString() || null,
      warrantyEnd: asset.warrantyEnd?.toISOString() || null,
      lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString() || null,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);
    const baseUrl = `/api/assets?${searchParams.toString()}`;
    const nextUrl = page < totalPages ? `${baseUrl}&page=${page + 1}` : null;
    const prevUrl = page > 1 ? `${baseUrl}&page=${page - 1}` : null;

    return NextResponse.json({
      assets: serializedAssets,
      pagination: {
        total,
        currentPage: page,
        totalPages,
        limit,
        nextUrl,
        prevUrl,
        currentCount: assets.length,
        startIndex: skip + 1,
      },
    });
  } catch (error) {
    console.error('GET /api/assets error:', error);
    return NextResponse.json({
      assets: [],
      pagination: {
        total: 0,
        currentPage: 1,
        totalPages: 0,
        limit: 9999,
        nextUrl: null,
        prevUrl: null,
        currentCount: 0,
        startIndex: 0,
      },
    });
  }
}

// ============================================
//  POST - إنشاء أصل جديد
// ============================================
export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();

    const {
      name,
      nameEn,
      description,
      typeId,
      statusId,
      roomId,
      notes,
      serialNumber,
      manufacturer,
      model,
      supplier,
    } = body;

    if (!name || !typeId || !roomId) {
      return NextResponse.json(
        { error: 'الاسم، النوع، والموقع (الغرفة) مطلوبين' },
        { status: 400 }
      );
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بالمستخدم' },
        { status: 400 }
      );
    }

    // ✅ جلب هرمية الغرفة
    const { buildingId, branchId } = await getRoomHierarchy(roomId);

    // ✅ التحقق من صلاحية المستخدم
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const userBranchIds = session.branchIds || [];
    if (!isAdmin && !userBranchIds.includes(branchId)) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية للوصول إلى هذا الفرع' },
        { status: 403 }
      );
    }

    // ✅ تحويل التواريخ
    const dates = parseAssetDates(body);
    const { purchaseDate, operationDate, warrantyEnd, lastMaintenanceDate } = dates;

    // ✅ التحقق من التواريخ
    validateDates(purchaseDate, operationDate, warrantyEnd);

    // ✅ التحقق من تفرد الرقم التسلسلي
    if (serialNumber) {
      const existingSerial = await prisma.asset.findFirst({
        where: {
          companyId,
          serialNumber,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (existingSerial) {
        return NextResponse.json(
          { error: 'الرقم التسلسلي مستخدم بالفعل في هذه الشركة' },
          { status: 409 }
        );
      }
    }

    // ✅ إنشاء الأصل مع إعادة المحاولة
    const asset = await createAssetWithRetry({
      name,
      nameEn,
      description,
      typeId,
      statusId,
      roomId,
      buildingId,
      branchId,
      companyId,
      purchaseDate,
      operationDate,
      warrantyEnd,
      lastMaintenanceDate,
      notes,
      serialNumber,
      manufacturer,
      model,
      supplier,
    });

    // ✅ تسجيل التدقيق (غير متزامن ولا يعطل العملية الأساسية)
    try {
      const auditDTO = buildAuditDTO(asset);
      await createAuditLog({
        action: AuditAction.CREATE,
        oldData: null,
        newData: auditDTO,
        userId: session.userId,
        userEmail: session.email,
        metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown' },
      });
    } catch (auditError) {
      console.error('Audit log creation failed:', auditError);
    }

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('POST /api/assets error:', error);

    // ✅ معالجة الأخطاء المخصصة
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // ✅ استخدام دالة مساعدة لاستخراج الرسالة
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}