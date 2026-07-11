// src/app/api/work-order-priorities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// =====================
// GET: جلب قائمة الأولويات
// =====================
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('work_orders.read');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const priorities = await prisma.workOrderPriority.findMany({
      where: {
        companyId,
        deletedAt: null, // استبعاد المحذوفين
      },
      orderBy: { order: 'asc' },
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

    return NextResponse.json(priorities);
  } catch (error: any) {
    console.error('GET /api/work-order-priorities error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// POST: إضافة أولوية جديدة
// =====================
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('work_orders.create');

    const body = await request.json();
    const { name, nameEn, code, description, color, icon, order, isDefault, isActive } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // التحقق من عدم تكرار الاسم أو الكود
    const existing = await prisma.workOrderPriority.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { name: name.trim() },
          { code: code?.trim() || undefined },
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'يوجد أولوية بنفس الاسم أو الكود بالفعل' },
        { status: 409 }
      );
    }

    // استخدام transaction لضمان ذرية تحديث isDefault
    const newPriority = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.workOrderPriority.updateMany({
          where: { companyId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.workOrderPriority.create({
        data: {
          name: name.trim(),
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          color: color || '#64748b',
          icon: icon?.trim() || null,
          order: typeof order === 'number' ? order : 0,
          isDefault: isDefault === true,
          isActive: isActive ?? true,
          companyId,
        },
      });
    });

    return NextResponse.json(newPriority, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/work-order-priorities error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// PUT: تحديث أولوية
// =====================
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('work_orders.update');

    const body = await request.json();
    const { id, name, nameEn, code, description, color, icon, order, isDefault, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
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
    if (name || code) {
      const duplicate = await prisma.workOrderPriority.findFirst({
        where: {
          companyId,
          deletedAt: null,
          NOT: { id },
          OR: [
            { name: name?.trim() || undefined },
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
          name: name?.trim() ?? existing.name,
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
    console.error('PUT /api/work-order-priorities error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// DELETE: حذف أولوية (Soft Delete)
// =====================
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('work_orders.delete');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

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
    console.error('DELETE /api/work-order-priorities error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}