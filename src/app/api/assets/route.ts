// src/app/api/assets/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

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
  const branchCode = branch.code;

  const assetType = await prisma.assetType.findUnique({
    where: { id: typeId },
    select: { code: true },
  });
  if (!assetType || !assetType.code) {
    throw new Error('نوع الأصل غير صالح أو لا يحتوي على رمز (code)');
  }
  const typeCode = assetType.code;

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
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const paddedNumber = nextNumber.toString().padStart(4, '0');
  return `ATS-${branchCode}-${typeCode}-${paddedNumber}`;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await requirePermission('assets.read', session);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const typeId = searchParams.get('typeId');
    const locationId = searchParams.get('locationId');
    const roomId = searchParams.get('roomId');           // ✅ دعم roomId
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const branchIds = session.user.branchIds || [];
    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (!isAdmin) {
      if (branchIds.length > 0) {
        where.building = {
          branchId: { in: branchIds }
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
    if (typeId && typeId !== 'all') where.typeId = typeId;

    // ✅ دمج roomId و locationId
    const effectiveRoomId = roomId || locationId;
    if (effectiveRoomId) {
      where.roomId = effectiveRoomId;
    }

    // ✅ طباعة معلومات التصحيح (ستظهر في سجلات Render)
    console.log("🔍 Assets API - roomId:", effectiveRoomId, "typeId:", typeId);
    console.log("🔍 Assets API - where:", JSON.stringify(where, null, 2));

    // ✅ تنفيذ الاستعلام مع try/catch محلي
    let assets, total;
    try {
      [assets, total] = await Promise.all([
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
                floor: {
                  select: {
                    id: true,
                    name: true,
                    nameEn: true,
                    building: {
                      select: { id: true, name: true, nameEn: true, branchId: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.asset.count({ where }),
      ]);
    } catch (dbError: any) {
      console.error("❌ Database query error:", dbError);
      return NextResponse.json(
        { error: 'خطأ في استعلام قاعدة البيانات', details: dbError.message },
        { status: 500 }
      );
    }

    const serializedAssets = assets.map((asset: any) => ({
      ...asset,
      purchaseDate: asset.purchaseDate?.toISOString() || null,
      warrantyEnd: asset.warrantyEnd?.toISOString() || null,
      lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString() || null,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      assets: serializedAssets,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error: any) {
    console.error("❌ GET /api/assets error details:", error);
    return NextResponse.json(
      { error: 'خطأ في الخادم', message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await requirePermission('assets.create', session);

    const body = await request.json();
    const { name, nameEn, typeId, statusId, roomId, purchaseDate, warrantyEnd, lastMaintenanceDate, notes } = body;

    if (!name || !typeId || !roomId) {
      return NextResponse.json({ error: 'الاسم، نوع الأصل، والموقع إلزامية' }, { status: 400 });
    }

    const companyId = session.user.companyId ?? undefined;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بالمستخدم' }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        buildingId: true,
        building: { select: { branchId: true } }
      },
    });
    if (!room) {
      return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 400 });
    }
    const buildingId = room.buildingId;
    const branchId = room.building?.branchId;
    if (!branchId) {
      return NextResponse.json({ error: 'الغرفة غير مرتبطة بفرع' }, { status: 400 });
    }

    const assetType = await prisma.assetType.findUnique({
      where: { id: typeId },
      select: { code: true },
    });
    if (!assetType || !assetType.code) {
      return NextResponse.json({ error: 'نوع الأصل غير صالح أو لا يحتوي على رمز (code)' }, { status: 400 });
    }

    const code = await generateAssetCode(companyId, branchId, typeId);
    const existing = await prisma.asset.findFirst({
      where: { code, companyId },
    });
    if (existing) {
      return NextResponse.json({ error: 'تعارض في توليد الكود، حاول مرة أخرى' }, { status: 409 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const building = await prisma.building.findUnique({
        where: { id: buildingId },
        select: { branchId: true }
      });
      const userBranchIds = session.user.branchIds || [];
      if (!building || !userBranchIds.includes(building.branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية إضافة أصل في هذا المبنى' }, { status: 403 });
      }
    }

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
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : undefined,
        notes: notes || undefined,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/assets error:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء الأصل', details: error.message },
      { status: 500 }
    );
  }
}