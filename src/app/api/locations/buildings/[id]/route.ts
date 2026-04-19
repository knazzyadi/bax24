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
    const { name, nameEn, code, order } = await request.json();

    const existing = await prisma.building.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'المبنى غير موجود' }, { status: 404 });
    }

    if (session.user?.role === 'ADMIN' && existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'لا يمكنك تعديل مبنى ليس ضمن شركتك' }, { status: 403 });
    }

    const building = await prisma.building.update({
      where: { id },
      data: { name, nameEn, code, order },
    });
    return NextResponse.json(building);
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

    // جلب المبنى مع جميع العلاقات الممكنة
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        floors: true,
        assets: true,
        workOrders: true,
        rooms: true,
        contracts: true,
        vehicles: true,
        maintenanceGroups: true,
        reports: true,
        usersBranch: true,
        userBuildings: true,
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'المبنى غير موجود' }, { status: 404 });
    }

    if (session.user?.role === 'ADMIN' && building.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'لا يمكنك حذف مبنى ليس ضمن شركتك' }, { status: 403 });
    }

    // بناء قائمة مفصلة بالعناصر المرتبطة
    const relations = [];
    if (building.floors.length > 0) relations.push(`${building.floors.length} دور(أدوار)`);
    if (building.rooms.length > 0) relations.push(`${building.rooms.length} غرفة(غرف)`);
    if (building.assets.length > 0) relations.push(`${building.assets.length} أصل(أصول)`);
    if (building.workOrders.length > 0) relations.push(`${building.workOrders.length} أمر(أوامر) عمل`);
    if (building.contracts.length > 0) relations.push(`${building.contracts.length} عقد(عقود)`);
    if (building.vehicles.length > 0) relations.push(`${building.vehicles.length} مركبة(مركبات)`);
    if (building.maintenanceGroups.length > 0) relations.push(`${building.maintenanceGroups.length} مجموعة صيانة`);
    if (building.reports.length > 0) relations.push(`${building.reports.length} بلاغ(بلاغات)`);
    if (building.usersBranch.length > 0) relations.push(`${building.usersBranch.length} مستخدم(مستخدمين) (فرع)`);
    if (building.userBuildings.length > 0) relations.push(`${building.userBuildings.length} مستخدم(مستخدمين) (مبنى)`);

    if (relations.length > 0) {
      const errorMessage = `لا يمكن حذف المبنى لأنه مرتبط بـ: ${relations.join('، ')}. يرجى حذف هذه العناصر أولاً.`;
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }

    // حذف المبنى (يمكن استبداله بالحذف الناعم إذا أردت)
    await prisma.building.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}