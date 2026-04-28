import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// =======================
// 🔹 تحديث المستخدم (الحالة أو البيانات الكاملة)
// =======================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // حالة 1: تحديث الحالة فقط (toggle)
    if (body.status !== undefined && Object.keys(body).length === 1) {
      if (typeof body.status !== 'boolean') {
        return NextResponse.json(
          { error: 'قيمة الحالة يجب أن تكون true أو false' },
          { status: 400 }
        );
      }
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status: body.status },
        select: { id: true, name: true, email: true, status: true },
      });
      return NextResponse.json({ success: true, user: updatedUser });
    }

    // حالة 2: تحديث كامل للبيانات (اسم، بريد، دور، شركة)
    const { name, email, roleId, companyId } = body;
    if (!name || !email || !roleId || !companyId) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني والدور والشركة مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // التحقق من عدم وجود بريد مكرر (باستثناء هذا المستخدم)
    const duplicateEmail = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (duplicateEmail) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم من قبل' }, { status: 409 });
    }

    // تحديث المستخدم
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, roleId, companyId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: { select: { id: true, name: true, label: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('UPDATE_USER_ERROR:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث المستخدم' },
      { status: 500 }
    );
  }
}

// =======================
// 🔴 حذف المستخدم
// =======================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // منع حذف السوبر أدمن
    if (user.role?.name === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'لا يمكن حذف حساب السوبر أدمن' },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('DELETE_USER_ERROR:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف المستخدم' },
      { status: 500 }
    );
  }
}