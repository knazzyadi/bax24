// src/app/api/work-order-priorities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// =====================
// GET: جلب أولوية واحدة
// =====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('work_orders.read');

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const priority = await prisma.workOrderPriority.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        color: true,
        icon: true,
        order: true,
        isDefault: true,
        isActive: true,
      },
    });

    if (!priority) {
      return NextResponse.json({ error: 'الأولوية غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(priority);
  } catch (error: any) {
    console.error('GET /api/work-order-priorities/[id] error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// PUT: تحديث أولوية
// =====================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('work_orders.update');

    const { id } = await params;
    const body = await request.json();
    const { name, nameEn, code, description, color, icon, order, isDefault, isActive } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // التحقق من وجود الأولوية
    const existing = await prisma.workOrderPriority.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الأولوية غير موجودة' }, { status: 404 });
    }

    // التحقق من عدم تكرار الاسم أو الكود (باستثناء نفس العنصر)
    const duplicate = await prisma.workOrderPriority.findFirst({
      where: {
        companyId,
        deletedAt: null,
        NOT: { id },
        OR: [
          { name: name.trim() },
          { code: code?.trim() || undefined },
        ],
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'يوجد أولوية بنفس الاسم أو الكود بالفعل' },
        { status: 409 }
      );
    }

    // تحديث داخل transaction
    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.workOrderPriority.updateMany({
          where: { companyId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.workOrderPriority.update({
        where: { id },
        data: {
          name: name.trim(),
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          color: color || existing.color,
          icon: icon?.trim() || null,
          order: typeof order === 'number' ? order : existing.order,
          isDefault: isDefault === true,
          isActive: isActive ?? existing.isActive,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/work-order-priorities/[id] error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// DELETE: حذف أولوية (Soft Delete)
// =====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('work_orders.delete');

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const existing = await prisma.workOrderPriority.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الأولوية غير موجودة' }, { status: 404 });
    }

    // منع حذف الأولوية الافتراضية
    if (existing.isDefault) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الأولوية الافتراضية' },
        { status: 400 }
      );
    }

    // Soft Delete
    await prisma.workOrderPriority.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/work-order-priorities/[id] error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}