import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('work_orders.read', session);

    const { id } = await params;
    const companyId = session.user.companyId;
    const priority = await prisma.workOrderPriority.findFirst({
      where: { id, companyId },
    });
    if (!priority) {
      return NextResponse.json({ error: 'الأولوية غير موجودة' }, { status: 404 });
    }
    return NextResponse.json(priority);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطأ في جلب الأولوية' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, nameEn, order, isDefault, color } = body;

    const companyId = session.user.companyId;
    const existing = await prisma.workOrderPriority.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الأولوية غير موجودة' }, { status: 404 });
    }

    // If this priority is being set as default, unset others
    if (isDefault === true && !existing.isDefault) {
      await prisma.workOrderPriority.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.workOrderPriority.update({
      where: { id },
      data: {
        name: name?.trim(),
        nameEn: nameEn?.trim() || null,
        order: typeof order === 'number' ? order : existing.order,
        isDefault: isDefault === true,
        color: color || existing.color,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'فشل تحديث الأولوية' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }

    const { id } = await params;
    const companyId = session.user.companyId;
    const existing = await prisma.workOrderPriority.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الأولوية غير موجودة' }, { status: 404 });
    }

    await prisma.workOrderPriority.delete({ where: { id } });
    return NextResponse.json({ message: 'تم الحذف بنجاح' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'فشل حذف الأولوية' }, { status: 500 });
  }
}