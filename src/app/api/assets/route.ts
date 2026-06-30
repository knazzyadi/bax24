// src/app/api/assets/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ========== دالة توليد كود فريد لكل (فرع + نوع) ==========
async function generateAssetCode(
  companyId: string,
  branchId: string,
  typeId: string
): Promise<string> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });

  if (!branch || !branch.code) {
    throw new Error('الفرع غير صالح أو لا يحتوي على رمز (code)');
  }

  const assetType = await prisma.assetType.findUnique({
    where: { id: typeId },
    select: { code: true },
  });

  if (!assetType || !assetType.code) {
    throw new Error('نوع الأصل غير صالح أو لا يحتوي على رمز (code)');
  }

  const lastAsset = await prisma.asset.findFirst({
    where: {
      companyId,
      branchId,
      typeId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });

  let nextNumber = 1;

  if (lastAsset?.code) {
    const match = lastAsset.code.match(/-(\d{4})$/);
    if (match) nextNumber = parseInt(match[1]) + 1;
  }

  const padded = nextNumber.toString().padStart(4, '0');

  return `${branch.code}-${assetType.code}-${padded}`;
}

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.read');

    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const typeId = searchParams.get('typeId');
    const locationId = searchParams.get('locationId');
    const roomId = searchParams.get('roomId');

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10'); // ✅ القيمة الافتراضية 10
    const skip = (page - 1) * limit;

    const isAdmin =
      session.role === 'ADMIN' ||
      session.role === 'SUPER_ADMIN';

    const branchIds = session.branchIds || [];
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const where: any = {
      companyId,
      deletedAt: null,
    };

    // تصحيح: البحث مباشرة في branchId بدلاً من building.branchId
    if (!isAdmin) {
      if (branchIds.length > 0) {
        where.branchId = {
          in: branchIds,
        };
      } else {
        return NextResponse.json({
          assets: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          limit,
        });
      }
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (typeId && typeId !== 'all') {
      where.typeId = typeId;
    }

    const effectiveRoomId = roomId || locationId;

    if (effectiveRoomId) {
      where.roomId = effectiveRoomId;
    }

    // ✅ إزالة سجلات التصحيح (كانت للاختبار فقط)
    // console.log('===== DEBUG START =====');
    // console.log('where:', JSON.stringify(where, null, 2));
    // console.log('===== DEBUG END =====');

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          nameEn: true,
          purchaseDate: true,
          warrantyEnd: true,
          lastMaintenanceDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          buildingId: true,
          type: {
            select: { id: true, name: true, nameEn: true, code: true },
          },
          status: {
            select: { id: true, name: true, nameEn: true, color: true },
          },
          room: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      prisma.asset.count({ where }),
    ]);

    const serializedAssets = assets.map((asset: any) => ({
      ...asset,
      purchaseDate: asset.purchaseDate?.toISOString() || null,
      warrantyEnd: asset.warrantyEnd?.toISOString() || null,
      lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString() || null,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    }));

    // حساب روابط الترقيم (next/prev) بناءً على الصفحة الحالية والحد الأقصى
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
  } catch (error: any) {
    console.error('GET /api/assets error:', error);

    return NextResponse.json(
      {
        error: 'خطأ في الخادم',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.create');

    const body = await request.json();

    const {
      name,
      nameEn,
      typeId,
      statusId,
      roomId,
      purchaseDate,
      warrantyEnd,
      lastMaintenanceDate,
      notes,
    } = body;

    // ✅ التأكد من وجود roomId (يمنع إنشاء أصل بدون غرفة)
    if (!name || !typeId || !roomId) {
      return NextResponse.json(
        { error: 'الاسم، النوع، والموقع (الغرفة) مطلوبين' },
        { status: 400 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    // ✅ التحقق من صحة الغرفة وأن لها فرع ومبنى
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        buildingId: true,
        building: { select: { branchId: true } },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة في قاعدة البيانات' },
        { status: 400 }
      );
    }

    if (!room.building?.branchId) {
      return NextResponse.json(
        { error: 'الغرفة غير مرتبطة بفرع أو مبنى صالح' },
        { status: 400 }
      );
    }

    const branchId = room.building.branchId;
    const buildingId = room.buildingId;

    const code = await generateAssetCode(companyId, branchId, typeId);

    const asset = await prisma.asset.create({
      data: {
        name,
        nameEn: nameEn || undefined,
        code,
        typeId,
        statusId: statusId || undefined,
        roomId,
        buildingId,
        branchId,
        companyId,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : undefined,
        lastMaintenanceDate: lastMaintenanceDate
          ? new Date(lastMaintenanceDate)
          : undefined,
        notes: notes || undefined,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/assets error:', error);

    return NextResponse.json(
      {
        error: 'خطأ في إنشاء الأصل',
        message: error.message,
      },
      { status: 500 }
    );
  }
}