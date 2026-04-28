import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// دالة مساعدة للتحقق من ملكية الغرفة وصلاحية التعديل/الحذف
async function getAuthorizedRoom(id: string, companyId: string) {
  return prisma.room.findFirst({
    where: {
      id,
      building: { companyId },
    },
    select: {
      id: true,
      name: true,
      nameEn: true,
      code: true,
      order: true,
      floorId: true,
      buildingId: true,
      assets: { select: { id: true } },
      workOrders: { select: { id: true } },
      inventoryItems: { select: { id: true } },
      maintenanceReports: { select: { id: true } },
    },
  });
}

// PUT: تحديث غرفة (للمدير فقط)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { id } = await params;
    const { name, nameEn, code, order, floorId, buildingId } = await request.json();

    if (!name || !code || !floorId || !buildingId) {
      return NextResponse.json(
        { error: 'الاسم، الكود، الدور، والمبنى مطلوبون' },
        { status: 400 }
      );
    }

    // التحقق من وجود الغرفة وانتمائها للشركة
    const existing = await getAuthorizedRoom(id, companyId);
    if (!existing) {
      return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
    }

    // التأكد أن المبنى والدور الجديدين ينتميان للشركة (إذا تغيرا)
    if (existing.buildingId !== buildingId) {
      const newBuilding = await prisma.building.findFirst({
        where: { id: buildingId, companyId },
      });
      if (!newBuilding) {
        return NextResponse.json({ error: 'المبنى الجديد غير صالح' }, { status: 400 });
      }
    }

    if (existing.floorId !== floorId) {
      const newFloor = await prisma.floor.findFirst({
        where: { id: floorId, buildingId },
      });
      if (!newFloor) {
        return NextResponse.json({ error: 'الدور الجديد غير صالح' }, { status: 400 });
      }
    }

    // التحقق من عدم تكرار الكود في نفس المبنى (باستثناء نفس الغرفة)
    const duplicate = await prisma.room.findFirst({
      where: {
        buildingId,
        code,
        NOT: { id },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'الكود موجود مسبقاً في هذا المبنى' },
        { status: 409 }
      );
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        name,
        nameEn: nameEn || null,
        code,
        order: order || 0,
        floorId,
        buildingId,
      },
    });

    revalidatePath('/ar/locations/rooms');
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('PUT /api/locations/rooms/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف غرفة (للمدير فقط)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { id } = await params;

    const room = await getAuthorizedRoom(id, companyId);
    if (!room) {
      return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
    }

    // جمع العلاقات النشطة لمنع الحذف
    const relations = [];
    if (room.assets.length) relations.push(`${room.assets.length} أصل`);
    if (room.workOrders.length) relations.push(`${room.workOrders.length} أمر عمل`);
    if (room.inventoryItems.length) relations.push(`${room.inventoryItems.length} مخزون`);
    if (room.maintenanceReports.length) relations.push(`${room.maintenanceReports.length} بلاغ`);

    if (relations.length > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف الغرفة لأنها مرتبطة بـ: ${relations.join('، ')}` },
        { status: 409 }
      );
    }

    await prisma.room.delete({ where: { id } });
    revalidatePath('/ar/locations/rooms');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/locations/rooms/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}