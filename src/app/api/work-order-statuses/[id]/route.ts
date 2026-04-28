// src/app/api/work-order-statuses/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const isAdmin = session.user.role === 'ADMIN';
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, nameEn, color, order, isDefault, companyId } = body; // ❌ removed description

    const existing = await prisma.workOrderStatus.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });

    if (isAdmin && existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'غير مصرح لهذه الشركة' }, { status: 403 });
    }

    let targetCompanyId = existing.companyId;
    if (isSuperAdmin && companyId) targetCompanyId = companyId;

    // التحقق من تكرار الاسم (باستثناء نفس المعرف)
    if (name && name !== existing.name) {
      const duplicate = await prisma.workOrderStatus.findFirst({
        where: { name: name.trim(), companyId: targetCompanyId, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'حالة بنفس الاسم موجودة مسبقاً' }, { status: 409 });
      }
    }

    if (isDefault === true) {
      await prisma.workOrderStatus.updateMany({
        where: { companyId: targetCompanyId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.workOrderStatus.update({
      where: { id },
      data: {
        name: name?.trim(),
        nameEn: nameEn?.trim() || null,
        color: color || '#64748b',
        order: typeof order === 'number' ? order : 0,
        isDefault: isDefault === true,
        companyId: targetCompanyId,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطأ في التحديث' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const isAdmin = session.user.role === 'ADMIN';
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.workOrderStatus.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });

    if (isAdmin && existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'غير مصرح لهذه الشركة' }, { status: 403 });
    }

    // منع الحذف إذا كانت الحالة مستخدمة في أوامر العمل
    const usedCount = await prisma.workOrder.count({ where: { statusId: id } });
    if (usedCount > 0) {
      return NextResponse.json({ error: 'لا يمكن الحذف لوجود أوامر عمل مرتبطة بهذه الحالة' }, { status: 400 });
    }

    await prisma.workOrderStatus.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطأ في الحذف' }, { status: 500 });
  }
}