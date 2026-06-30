// src/app/api/locations/floors/[id]/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// PUT: تحديث دور
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من الجلسة والصلاحية باستخدام النظام المركزي
    const session = await getAuthenticatedSession() as any;
    await checkPermission('locations.write');

    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { id } = await params;
    const { name, nameEn, code, order, buildingId } = await request.json();

    if (!name || !code || !buildingId) {
      return NextResponse.json(
        { error: 'الاسم والكود والمبنى مطلوبون' },
        { status: 400 }
      );
    }

    // جلب الدور مع المبنى للتحقق من الملكية
    const existingFloor = await prisma.floor.findFirst({
      where: { id },
      include: { building: { select: { companyId: true } } },
    });
    if (!existingFloor) {
      return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 });
    }

    // التحقق من أن الدور ينتمي لنفس الشركة
    if (existingFloor.building.companyId !== companyId) {
      return NextResponse.json(
        { error: 'لا يمكنك تعديل هذا الدور' },
        { status: 403 }
      );
    }

    // التحقق من أن المبنى الجديد (إذا تغير) ينتمي لنفس الشركة
    if (buildingId !== existingFloor.buildingId) {
      const newBuilding = await prisma.building.findFirst({
        where: { id: buildingId, companyId },
      });
      if (!newBuilding) {
        return NextResponse.json(
          { error: 'المبنى الجديد غير صالح أو لا ينتمي لشركتك' },
          { status: 400 }
        );
      }
    }

    // التحقق من عدم تكرار الكود في نفس المبنى (مع استثناء نفس الدور)
    const duplicate = await prisma.floor.findFirst({
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

    // تحديث الدور
    const updatedFloor = await prisma.floor.update({
      where: { id },
      data: {
        name,
        nameEn: nameEn || null,
        code,
        order: order || 0,
        buildingId,
      },
    });

    revalidatePath('/ar/locations/floors');
    return NextResponse.json(updatedFloor);
  } catch (error: any) {
    console.error('PUT /api/locations/floors/[id] error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف دور
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ التحقق من الجلسة والصلاحية باستخدام النظام المركزي
    const session = await getAuthenticatedSession() as any;
    await checkPermission('locations.write');

    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { id } = await params;

    // جلب الدور مع المبنى للتحقق من الملكية
    const floor = await prisma.floor.findFirst({
      where: { id },
      include: { building: { select: { companyId: true } } },
    });
    if (!floor) {
      return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 });
    }

    // التحقق من أن الدور ينتمي لنفس الشركة
    if (floor.building.companyId !== companyId) {
      return NextResponse.json(
        { error: 'لا يمكنك حذف هذا الدور' },
        { status: 403 }
      );
    }

    // التحقق من وجود غرف مرتبطة
    const roomsCount = await prisma.room.count({ where: { floorId: id } });
    if (roomsCount > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف الدور لأنه يحتوي على ${roomsCount} غرفة مرتبطة` },
        { status: 409 }
      );
    }

    await prisma.floor.delete({ where: { id } });
    revalidatePath('/ar/locations/floors');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/locations/floors/[id] error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}