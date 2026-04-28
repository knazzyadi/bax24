import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// GET: جلب مبنى واحد (للمدير فقط)
export async function GET(
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
    const building = await prisma.building.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        order: true,
        branchId: true,
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'المبنى غير موجود' }, { status: 404 });
    }

    return NextResponse.json(building);
  } catch (error) {
    console.error('GET /api/locations/buildings/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// PUT: تحديث مبنى (للمدير فقط)
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
    const { name, nameEn, code, order, branchId } = await request.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'الاسم والرمز مطلوبان' }, { status: 400 });
    }

    // التحقق من أن المبنى يخص نفس الشركة
    const existing = await prisma.building.findFirst({
      where: { id, companyId },
      select: { id: true, code: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'المبنى غير موجود أو لا ينتمي لشركتك' }, { status: 404 });
    }

    // التحقق من عدم تكرار الكود داخل نفس الشركة (استثناء المبنى الحالي)
    const duplicate = await prisma.building.findFirst({
      where: {
        code,
        companyId,
        NOT: { id },
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: 'الكود موجود مسبقاً في شركتك' }, { status: 409 });
    }

    // التحقق من أن الفرع (إن وجد) ينتمي لنفس الشركة
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, companyId },
      });
      if (!branch) {
        return NextResponse.json(
          { error: 'الفرع المحدد غير صالح أو لا ينتمي لشركتك' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.building.update({
      where: { id },
      data: {
        name,
        nameEn: nameEn || null,
        code,
        order: order || 0,
        branchId: branchId || null,
      },
    });

    revalidatePath('/ar/locations/buildings');
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/locations/buildings/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف مبنى (للمدير فقط)
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

    // جلب المبنى مع حساب عدد الأدوار المرتبطة
    const building = await prisma.building.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        _count: { select: { floors: true } },
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'المبنى غير موجود' }, { status: 404 });
    }

    if (building._count.floors > 0) {
      return NextResponse.json(
        {
          error: `لا يمكن حذف المبنى لأنه مرتبط بـ ${building._count.floors} دور(أدوار). قم بحذف الأدوار أولاً.`,
        },
        { status: 409 }
      );
    }

    await prisma.building.delete({ where: { id } });
    revalidatePath('/ar/locations/buildings');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/locations/buildings/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}