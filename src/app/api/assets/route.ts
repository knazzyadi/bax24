// src/app/api/assets/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

// ========== دالة توليد كود فريد لكل نوع أصل ==========
async function generateAssetCode(companyId: string, typeId: string): Promise<string> {
  // 1. الحصول على رمز نوع الأصل (مثل "EL", "MED")
  const assetType = await prisma.assetType.findUnique({
    where: { id: typeId },
    select: { code: true },
  });
  if (!assetType || !assetType.code) {
    throw new Error('نوع الأصل غير صالح أو لا يحتوي على رمز (code)');
  }
  const typeCode = assetType.code;

  // 2. البحث عن آخر أصل من نفس النوع ونفس الشركة (للتسلسل)
  const lastAsset = await prisma.asset.findFirst({
    where: {
      companyId,
      typeId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastAsset?.code) {
    // استخراج الرقم التسلسلي من الكود (مفترضاً الصيغة "AST-0001-EL")
    const match = lastAsset.code.match(/AST-(\d+)-/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const paddedNumber = nextNumber.toString().padStart(4, '0');
  return `AST-${paddedNumber}-${typeCode}`;
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
    if (locationId) where.roomId = locationId;

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

    const serializedAssets = assets.map((asset: any) => ({
      ...asset,
      purchaseDate: asset.purchaseDate?.toISOString() || null,
      warrantyEnd: asset.warrantyEnd?.toISOString() || null,
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
    console.error('GET /api/assets error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await requirePermission('assets.create', session);

    const body = await request.json();
    // ✅ removed 'code' from destructuring – it will be auto‑generated
    const { name, nameEn, typeId, statusId, roomId, purchaseDate, warrantyEnd, notes } = body;

    // ✅ 'code' no longer required; 'typeId' becomes mandatory
    if (!name || !typeId || !roomId) {
      return NextResponse.json({ error: 'الاسم، نوع الأصل، والموقع إلزامية' }, { status: 400 });
    }

    const companyId = session.user.companyId ?? undefined;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بالمستخدم' }, { status: 400 });
    }

    // ✅ التحقق من وجود نوع الأصل (للتأكد من وجود رمز)
    const assetType = await prisma.assetType.findUnique({
      where: { id: typeId },
      select: { code: true },
    });
    if (!assetType || !assetType.code) {
      return NextResponse.json({ error: 'نوع الأصل غير صالح أو لا يحتوي على رمز (code)' }, { status: 400 });
    }

    // ✅ توليد الكود تلقائياً
    const code = await generateAssetCode(companyId, typeId);

    // (اختياري) يمكنك إزالة التحقق من وجود الكود لأنه مضمون أنه فريد بفضل التوليد
    // لكن نبقيه للتأكد
    const existing = await prisma.asset.findFirst({
      where: { code, companyId },
    });
    if (existing) {
      // هذا لا يجب أن يحدث أبداً، لكن للمرونة
      return NextResponse.json({ error: 'تعارض في توليد الكود، حاول مرة أخرى' }, { status: 409 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { buildingId: true },
    });
    if (!room) {
      return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 400 });
    }
    const buildingId = room.buildingId;

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
        companyId,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : undefined,
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