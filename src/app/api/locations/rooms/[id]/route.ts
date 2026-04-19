import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const { name, nameEn, code, order, floorId, buildingId } = await request.json();

    // التحقق من وجود الغرفة
    const existing = await prisma.room.findUnique({
      where: { id },
      include: { building: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
    }

    // لأدمن الشركة: التأكد من أن المبنى يتبع شركته
    if (session.user?.role === 'ADMIN') {
      const building = await prisma.building.findUnique({ where: { id: buildingId || existing.buildingId } });
      if (!building || building.companyId !== session.user.companyId) {
        return NextResponse.json({ error: 'لا يمكنك تعديل غرفة لمبنى ليس ضمن شركتك' }, { status: 403 });
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        name,
        nameEn: nameEn || null,
        code,
        order: order || 0,
        floorId: floorId || existing.floorId,
        buildingId: buildingId || existing.buildingId,
      },
    });
    return NextResponse.json(room);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        building: true,
        assets: true,
        workOrders: true,
        inventoryItems: true,
        maintenanceReports: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
    }

    if (session.user?.role === 'ADMIN' && room.building.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'لا يمكنك حذف غرفة ليس ضمن شركتك' }, { status: 403 });
    }

    // بناء قائمة بالعناصر المرتبطة
    const relations = [];
    if (room.assets.length > 0) relations.push(`${room.assets.length} أصل(أصول)`);
    if (room.workOrders.length > 0) relations.push(`${room.workOrders.length} أمر(أوامر) عمل`);
    if (room.inventoryItems.length > 0) relations.push(`${room.inventoryItems.length} صنف(أصناف) مخزون`);
    if (room.maintenanceReports.length > 0) relations.push(`${room.maintenanceReports.length} بلاغ(بلاغات) صيانة`);

    if (relations.length > 0) {
      const errorMessage = `لا يمكن حذف الغرفة لأنها مرتبطة بـ: ${relations.join('، ')}. يرجى حذف هذه العناصر أولاً.`;
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }

    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}