import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// GET: جلب جميع مباني الشركة (للمدير فقط)
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

    const buildings = await prisma.building.findMany({
      where: { companyId },
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { order: 'asc' },
    });

    const formatted = buildings.map((b) => ({
      id: b.id,
      name: b.name,
      nameEn: b.nameEn,
      code: b.code,
      order: b.order,
      branchId: b.branchId,
      branchName: b.branch?.name || null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('GET /api/locations/buildings error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إضافة مبنى جديد (للمدير فقط)
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

    const { name, nameEn, code, order, branchId } = await request.json();
    if (!name || !code) {
      return NextResponse.json({ error: 'الاسم والرمز مطلوبان' }, { status: 400 });
    }

    const building = await prisma.building.create({
      data: {
        name,
        nameEn: nameEn || null,
        code,
        order: order || 0,
        companyId,
        branchId: branchId || null,
      },
    });

    // مسح كاش الصفحة
    revalidatePath('/ar/locations/buildings');

    return NextResponse.json(building, { status: 201 });
  } catch (error) {
    console.error('POST /api/locations/buildings error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}