// src/app/api/assets/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

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

    // 🔥 الفلترة حسب الفروع للمستخدمين غير الأدمن
    if (!isAdmin) {
      if (branchIds.length > 0) {
        // استخدام العلاقة المباشرة building.branchId (أسرع وأكثر دقة)
        where.building = {
          branchId: { in: branchIds }
        };
      } else {
        // لا فروع مسموحة -> لا نعرض أي أصول
        return NextResponse.json({
          assets: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          limit,
        });
      }
    }

    // فلاتر البحث والنوع والموقع
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
    const { name, nameEn, code, typeId, statusId, roomId, purchaseDate, warrantyEnd, notes } = body;

    if (!name || !code || !roomId) {
      return NextResponse.json({ error: 'الاسم، الكود، والموقع إلزامية' }, { status: 400 });
    }

    const companyId = session.user.companyId ?? undefined;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بالمستخدم' }, { status: 400 });
    }

    const existing = await prisma.asset.findFirst({
      where: { code, companyId },
    });
    if (existing) {
      return NextResponse.json({ error: 'هذا الكود مستخدم مسبقاً' }, { status: 409 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { buildingId: true },
    });
    if (!room) {
      return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 400 });
    }
    const buildingId = room.buildingId;

    // التحقق من الصلاحية على المبنى (لغير ADMIN)
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
        typeId: typeId || undefined,
        statusId: statusId || undefined,
        roomId: roomId || undefined,
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