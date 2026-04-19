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
    const { name, nameEn, code, order, buildingId } = await request.json();

    // التحقق من وجود الدور
    const existing = await prisma.floor.findUnique({
      where: { id },
      include: { building: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 });
    }

    // لأدمن الشركة: التأكد من أن الدور يتبع شركته (عن طريق المبنى)
    if (session.user?.role === 'ADMIN' && existing.building.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'لا يمكنك تعديل دور ليس ضمن شركتك' }, { status: 403 });
    }

    // إذا تم تغيير المبنى، تحقق من صلاحيته
    if (buildingId && buildingId !== existing.buildingId) {
      const newBuilding = await prisma.building.findUnique({ where: { id: buildingId } });
      if (session.user?.role === 'ADMIN' && (!newBuilding || newBuilding.companyId !== session.user.companyId)) {
        return NextResponse.json({ error: 'لا يمكنك نقل دور إلى مبنى ليس ضمن شركتك' }, { status: 403 });
      }
    }

    const floor = await prisma.floor.update({
      where: { id },
      data: {
        name,
        nameEn: nameEn || null,
        code,
        order: order || 0,
        buildingId: buildingId || existing.buildingId,
      },
    });
    return NextResponse.json(floor);
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

    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        building: true,
        rooms: true, // التحقق من وجود غرف مرتبطة
      },
    });

    if (!floor) {
      return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 });
    }

    // لأدمن الشركة: التأكد من أن الدور يتبع شركته
    if (session.user?.role === 'ADMIN' && floor.building.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'لا يمكنك حذف دور ليس ضمن شركتك' }, { status: 403 });
    }

    // منع الحذف إذا كانت هناك غرف مرتبطة
    if (floor.rooms && floor.rooms.length > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الدور لأنه مرتبط بغرف. قم بحذف الغرف أولاً.' },
        { status: 409 }
      );
    }

    await prisma.floor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}