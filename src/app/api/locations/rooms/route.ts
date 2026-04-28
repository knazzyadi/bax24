import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// GET: جلب جميع الغرف الخاصة بمباني الشركة (للمدير فقط)
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بهذا الحساب' }, { status: 400 });
    }

    const rooms = await prisma.room.findMany({
      where: {
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
        floor: {
          select: { id: true, name: true, nameEn: true, code: true },
        },
        building: {
          select: { id: true, name: true, nameEn: true, code: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('GET /api/locations/rooms error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إضافة غرفة جديدة (للمدير فقط)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { name, nameEn, code, order, floorId, buildingId } = await request.json();
    if (!name || !code || !floorId || !buildingId) {
      return NextResponse.json(
        { error: 'الاسم، الكود، الدور، والمبنى مطلوبون' },
        { status: 400 }
      );
    }

    // التأكد أن المبنى والدور ينتميان للشركة
    const building = await prisma.building.findFirst({
      where: { id: buildingId, companyId },
    });
    if (!building) {
      return NextResponse.json(
        { error: 'المبنى غير موجود أو لا ينتمي لشركتك' },
        { status: 403 }
      );
    }

    const floor = await prisma.floor.findFirst({
      where: { id: floorId, buildingId },
    });
    if (!floor) {
      return NextResponse.json(
        { error: 'الدور غير موجود أو لا ينتمي لهذا المبنى' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار الكود في نفس المبنى
    const existing = await prisma.room.findFirst({
      where: { buildingId, code },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'الكود موجود مسبقاً في هذا المبنى' },
        { status: 409 }
      );
    }

    const room = await prisma.room.create({
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
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('POST /api/locations/rooms error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}