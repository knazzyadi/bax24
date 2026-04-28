import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('assets.read', session);

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status'); // 'low', 'out', أو 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const branchIds = session.user.branchIds || [];

    const where: any = {
      companyId,
      deletedAt: null,
    };

    // ✅ فلترة حسب الفروع (لغير الأدمن)
    if (!isAdmin) {
      if (branchIds.length > 0) {
        where.room = {
          floor: {
            building: {
              branchId: { in: branchIds }
            }
          }
        };
      } else {
        // لا فروع مسموحة -> لا نعرض أي أصناف
        return NextResponse.json({
          items: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          limit,
        });
      }
    }

    // فلترة البحث
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    // فلترة حالة المخزون
    if (status === 'low') {
      where.quantity = { lt: prisma.inventoryItem.fields.minQuantity };
    } else if (status === 'out') {
      where.quantity = 0;
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          room: {
            include: {
              floor: {
                include: {
                  building: {
                    include: { branch: true },
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
      prisma.inventoryItem.count({ where }),
    ]);

    // تحويل التواريخ والبيانات
    const serialized = items.map((item: any) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      room: item.room ? {
        id: item.room.id,
        name: item.room.name,
        nameEn: item.room.nameEn,
        code: item.room.code,
        floor: item.room.floor ? {
          id: item.room.floor.id,
          name: item.room.floor.name,
          nameEn: item.room.floor.nameEn,
          building: item.room.floor.building ? {
            id: item.room.floor.building.id,
            name: item.room.floor.building.name,
            nameEn: item.room.floor.building.nameEn,
          } : null,
        } : null,
      } : null,
    }));

    return NextResponse.json({
      items: serialized,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error: any) {
    console.error('GET /api/inventory error:', error);
    return NextResponse.json({ error: 'خطأ في جلب المخزون' }, { status: 500 });
  }
}

// POST يبقى كما هو (تم تعديله سابقاً ليعمل مع connect)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await requirePermission('assets.create', session);

    const body = await request.json();
    const { name, nameEn, sku, quantity, minQuantity, unit, roomId, notes } = body;

    if (!name || !roomId) {
      return NextResponse.json({ error: 'الاسم والغرفة إلزاميان' }, { status: 400 });
    }

    const companyId = session.user.companyId!;

    // التحقق من أن الغرفة تنتمي إلى الشركة وإلى فرع المستخدم (إذا لم يكن أدمن)
    const room = await prisma.room.findFirst({
      where: { id: roomId, floor: { building: { companyId } } },
      include: { floor: { include: { building: true } } }
    });
    if (!room) {
      return NextResponse.json({ error: 'الغرفة غير موجودة أو لا تنتمي لشركتك' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.user.branchIds || [];
      const buildingBranchId = room.floor?.building?.branchId;
      if (!buildingBranchId || !userBranchIds.includes(buildingBranchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية إضافة صنف في هذه الغرفة' }, { status: 403 });
      }
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        nameEn: nameEn || null,
        sku: sku || null,
        quantity: quantity ?? 0,
        minQuantity: minQuantity ?? 0,
        unit: unit || null,
        notes: notes || null,
        room: { connect: { id: roomId } },
        company: { connect: { id: companyId } },
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/inventory error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء الصنف' }, { status: 500 });
  }
}