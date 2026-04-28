import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// GET: جلب جميع الأدوار الخاصة بمباني الشركة (للمدير فقط)
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

    // جلب جميع الأدوار المرتبطة بمباني الشركة
    const floors = await prisma.floor.findMany({
      where: {
        building: {
          companyId: companyId,
        },
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        order: true,
        buildingId: true,
        building: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // تنسيق البيانات لتناسب الواجهة
    const formatted = floors.map((f) => ({
      id: f.id,
      name: f.name,
      nameEn: f.nameEn,
      code: f.code,
      order: f.order,
      buildingId: f.buildingId,
      building: f.building,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('GET /api/locations/floors error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إضافة دور جديد (للمدير فقط)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بهذا الحساب' }, { status: 400 });
    }

    const { name, nameEn, code, order, buildingId } = await request.json();
    if (!name || !code || !buildingId) {
      return NextResponse.json(
        { error: 'الاسم، الكود، والمبنى مطلوبون' },
        { status: 400 }
      );
    }

    // التحقق من أن المبنى ينتمي لنفس الشركة
    const building = await prisma.building.findFirst({
      where: { id: buildingId, companyId },
    });
    if (!building) {
      return NextResponse.json(
        { error: 'المبنى غير موجود أو لا ينتمي لشركتك' },
        { status: 404 }
      );
    }

    // التحقق من عدم تكرار الكود في نفس المبنى
    const existingFloor = await prisma.floor.findFirst({
      where: { buildingId, code },
    });
    if (existingFloor) {
      return NextResponse.json(
        { error: 'الكود موجود مسبقاً في هذا المبنى' },
        { status: 409 }
      );
    }

    const newFloor = await prisma.floor.create({
      data: {
        name,
        nameEn: nameEn || null,
        code,
        order: order || 0,
        buildingId,
      },
    });

    // مسح كاش الصفحة
    revalidatePath('/ar/locations/floors');

    return NextResponse.json(newFloor, { status: 201 });
  } catch (error) {
    console.error('POST /api/locations/floors error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}