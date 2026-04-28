import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!user) return NextResponse.json({ error: 'مستخدم غير موجود' }, { status: 404 });

    // استخراج id من params
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'معرف الفرع مطلوب' }, { status: 400 });
    }

    const body = await request.json();
    const { name, nameEn, code, companyId } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'اسم الفرع والكود مطلوبان' }, { status: 400 });
    }

    // جلب الفرع الحالي باستخدام id الصحيح
    const existingBranch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existingBranch) {
      return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 });
    }

    const roleName = user.role?.name;

    // التحقق من الصلاحية
    if (roleName !== 'SUPER_ADMIN' && existingBranch.companyId !== user.companyId) {
      return NextResponse.json({ error: 'لا تملك صلاحية تعديل هذا الفرع' }, { status: 403 });
    }

    // التحقق من عدم تكرار الكود (مع استثناء الفرع الحالي)
    const duplicate = await prisma.branch.findFirst({
      where: {
        code,
        companyId: existingBranch.companyId,
        NOT: { id },
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: 'الكود موجود مسبقاً في هذه الشركة' }, { status: 409 });
    }

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name,
        nameEn: nameEn || null,
        code,
      },
    });

    return NextResponse.json(updatedBranch);
  } catch (error) {
    console.error('PUT /api/branches/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!user) return NextResponse.json({ error: 'مستخدم غير موجود' }, { status: 404 });

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'معرف الفرع مطلوب' }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 });
    }

    const roleName = user.role?.name;
    if (roleName !== 'SUPER_ADMIN' && branch.companyId !== user.companyId) {
      return NextResponse.json({ error: 'لا تملك صلاحية حذف هذا الفرع' }, { status: 403 });
    }

    await prisma.branch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/branches/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}