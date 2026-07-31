// src/app/api/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAuthenticatedSession, type AuthSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import {
  createAsset,
  getErrorResponseStatus,
} from '@/lib/assets';

// ========== الثوابت ==========
// إزالة 'status' لأنها علاقة وليست عموداً مباشراً
const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'code',
  'purchaseDate',
] as const;

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// ========== تحويل الجلسة ==========
function toAssetsSession(session: AuthSession) {
  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    companyId: session.companyId ?? null,
    companyName: session.companyName ?? null,
    companyNameEn: session.companyNameEn ?? null,
    branchId: session.branchId ?? null,
    branchIds: session.branchIds ?? [],
    isAdmin: session.isAdmin,
    isSuperAdmin: session.isSuperAdmin,
  };
}

// ========== GET ==========
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;

    // الصفحة والحد
    const page = Math.max(Number(searchParams.get('page')) || 1, 1);
    const requestedLimit = Number(searchParams.get('limit')) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    // الترتيب
    const requestedSort = searchParams.get('sortBy') || 'createdAt';
    const sortBy = ALLOWED_SORT_FIELDS.includes(
      requestedSort as typeof ALLOWED_SORT_FIELDS[number]
    )
      ? (requestedSort as typeof ALLOWED_SORT_FIELDS[number])
      : 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // الفلاتر الأساسية
    const branchId = searchParams.get('branchId') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const floorId = searchParams.get('floorId') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const status = searchParams.get('status') || undefined;
    const typeId = searchParams.get('typeId') || undefined;
    const search = searchParams.get('q') || undefined;

    // ===== بناء شرط WHERE =====
    const where: Prisma.AssetWhereInput = {
      deletedAt: null,
    };

    // 1. الأمان: تحديد نطاق الشركة (إلزامي)
    if (session.companyId) {
      where.companyId = session.companyId;
    } else {
      // إذا لم توجد companyId في الجلسة، نمنع الوصول (أمان إضافي)
      return NextResponse.json({ error: 'لا يمكن تحديد الشركة' }, { status: 400 });
    }

    // 2. البحث النصي
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 3. الفلاتر البسيطة
    if (status) where.statusId = status;
    if (typeId) where.typeId = typeId;

    // 4. فلترة الفرع مع التحقق من نطاق الشركة
    if (branchId) {
      // التأكد من أن الفرع يتبع نفس الشركة (يمكن إضافة شرط relation)
      where.branchId = branchId;
      // نضمن أن companyId موجود بالفعل (من السابق)
    }

    // 5. فلترة الموقع
    let roomIds: string[] | undefined;

    if (roomId) {
      // غرفة محددة
      roomIds = [roomId];
    } else if (floorId) {
      // جلب الغرف في الطابق المطلوب مع التأكد من أنها ضمن نطاق الشركة
      const rooms = await prisma.room.findMany({
        where: {
          floorId,
          floor: {
            building: {
              companyId: session.companyId,
            },
          },
        },
        select: { id: true },
      });
      roomIds = rooms.map((r) => r.id);
      if (roomIds.length === 0) {
        return NextResponse.json({
          assets: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
    } else if (buildingId) {
      // استخدام buildingId مباشرة من Asset (أسرع)
      where.buildingId = buildingId;
      // ملاحظة: يمكن إضافة شرط relation للتحقق من companyId إذا لزم الأمر
      // لكن companyId موجود مسبقاً في where
    }

    // تطبيق فلتر roomIds إن وجد
    if (roomIds && roomIds.length > 0) {
      where.roomId = { in: roomIds };
    }

    // 6. بناء orderBy (مع دعم خاص للحالة إذا أردنا)
    const orderBy = { [sortBy]: sortOrder };

    // ===== تنفيذ الاستعلام =====
    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          type: true,
          status: true,
          branch: true,
          room: {
            include: {
              floor: {
                include: {
                  building: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({
      assets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const response = getErrorResponseStatus(error);
    return NextResponse.json(response.body, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  }
}

// ========== POST ==========
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'بيانات الطلب غير صالحة (JSON غير صحيح)' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'بيانات الطلب غير صحيحة' },
        { status: 400 }
      );
    }

    // ملاحظة: من المفترض أن دالة createAsset تقوم بالتحقق من:
    // - أن roomId موجود (إذا تم توفيره)
    // - أن roomId يتبع buildingId المقدم
    // - أن buildingId يتبع branchId المقدم (إن وجد)
    // - وأن branchId يتبع companyId من الجلسة
    // - وأن جميع العلاقات متسقة.
    // هذا يمنع إنشاء أصول ببيانات غير متسقة.
    const asset = await createAsset(toAssetsSession(session), body);

    return NextResponse.json(asset, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    const response = getErrorResponseStatus(error);
    return NextResponse.json(response.body, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  }
}