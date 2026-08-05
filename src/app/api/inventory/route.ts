// src/app/api/inventory/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, requirePermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// نوع العنصر مع العلاقات المضمنة
type InventoryItemWithRelations = Prisma.InventoryItemGetPayload<{
  include: {
    room: {
      include: {
        floor: {
          include: {
            building: {
              include: {
                branch: true;
              };
            };
          };
        };
      };
    };
  };
}>;

// نوع بيانات الجسم في طلب POST
type CreateInventoryBody = {
  name: string;
  nameEn?: string;
  sku?: string;
  quantity?: number;
  minQuantity?: number;
  unit?: string;
  roomId: string;
  notes?: string;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('assets.read');

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status'); // 'low', 'out', أو 'all'
    const inStock = searchParams.get('inStock') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const companyId = session.companyId!;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const branchIds = session.branchIds || [];

    // بناء where بالتدريج بنوع صريح
    const where: Prisma.InventoryItemWhereInput = {
      companyId,
      deletedAt: null,
    };

    // إضافة قيود الفروع إذا لم يكن المستخدم أدمن
    if (!isAdmin) {
      if (branchIds.length > 0) {
        where.room = {
          floor: {
            building: {
              branchId: { in: branchIds },
            },
          },
        };
      } else {
        // لا فروع مسموحة -> لا نعرض أي أصناف
        if (inStock) {
          return NextResponse.json([]);
        }
        return NextResponse.json({
          items: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          limit,
        });
      }
    }

    // البحث النصي
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    // حالة out (كمية = 0) - يمكن تطبيقها مباشرة
    if (status === 'out') {
      where.quantity = 0;
    }

    // معالجة حالة low (quantity < minQuantity) باستخدام استعلام مساعد لجلب المعرفات
    let lowItemIds: string[] | null = null;
    if (status === 'low') {
      // نستعمل where الحالي (بدون شرط الكمية) لجلب جميع العناصر المطابقة للشروط الأخرى
      const allItems = await prisma.inventoryItem.findMany({
        where,
        select: { id: true, quantity: true, minQuantity: true },
      });
      lowItemIds = allItems
        .filter((item) => item.quantity < item.minQuantity)
        .map((item) => item.id);

      // إذا لم يكن هناك عناصر low نعيد استجابة فارغة
      if (lowItemIds.length === 0) {
        if (inStock) {
          return NextResponse.json([]);
        }
        return NextResponse.json({
          items: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          limit,
        });
      }
    }

    // إضافة شرط inStock (quantity > 0)
    if (inStock) {
      where.quantity = { gt: 0 };
    }

    // إضافة شرط lowItemIds إذا وجدت
    if (lowItemIds !== null) {
      where.id = { in: lowItemIds };
    }

    // إذا كان الطلب خاص بالعناصر المتاحة فقط (بدون pagination) وليس هناك فلتر status
    if (inStock && !status) {
      const items = await prisma.inventoryItem.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          unit: true,
        },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(items);
    }

    // الوضع العادي مع pagination
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

    // تحويل التواريخ إلى نصوص وتسوية هيكل room
    const serialized = items.map((item: InventoryItemWithRelations) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      room: item.room
        ? {
            id: item.room.id,
            name: item.room.name,
            nameEn: item.room.nameEn,
            code: item.room.code,
            floor: item.room.floor
              ? {
                  id: item.room.floor.id,
                  name: item.room.floor.name,
                  nameEn: item.room.floor.nameEn,
                  building: item.room.floor.building
                    ? {
                        id: item.room.floor.building.id,
                        name: item.room.floor.building.name,
                        nameEn: item.room.floor.building.nameEn,
                      }
                    : null,
                }
              : null,
          }
        : null,
    }));

    return NextResponse.json({
      items: serialized,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error: unknown) {
    console.error('GET /api/inventory error:', error);
    return NextResponse.json({ error: 'خطأ في جلب المخزون' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('assets.create');

    const body: CreateInventoryBody = await request.json();
    const { name, nameEn, sku, quantity, minQuantity, unit, roomId, notes } = body;

    if (!name || !roomId) {
      return NextResponse.json({ error: 'الاسم والغرفة إلزاميان' }, { status: 400 });
    }

    const companyId = session.companyId!;

    // التحقق من أن الغرفة تنتمي إلى الشركة
    const room = await prisma.room.findFirst({
      where: { id: roomId, floor: { building: { companyId } } },
      include: { floor: { include: { building: true } } },
    });
    if (!room) {
      return NextResponse.json({ error: 'الغرفة غير موجودة أو لا تنتمي لشركتك' }, { status: 400 });
    }

    // التحقق من صلاحية الفرع إذا لم يكن أدمن
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
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
  } catch (error: unknown) {
    console.error('POST /api/inventory error:', error);
    return NextResponse.json({ error: 'خطأ في إنشاء الصنف' }, { status: 500 });
  }
}