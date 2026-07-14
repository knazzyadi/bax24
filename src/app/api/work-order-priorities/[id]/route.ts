// src/app/api/work-order-priorities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId;

    const priority = await prisma.workOrderPriority.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        color: true,
        order: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!priority) {
      return NextResponse.json({ error: 'الأولوية غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(priority);
  } catch (error) {
    console.error('Error in GET /api/work-order-priorities/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الأولوية' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId;
    const body = await request.json();
    const { name, nameEn, code, color, order, isDefault, isActive } = body;

    const existingPriority = await prisma.workOrderPriority.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existingPriority) {
      return NextResponse.json({ error: 'الأولوية غير موجودة' }, { status: 404 });
    }

    if (name?.trim()) {
      const duplicate = await prisma.workOrderPriority.findFirst({
        where: {
          companyId,
          name: name.trim(),
          deletedAt: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'هناك أولوية بنفس الاسم بالفعل' }, { status: 409 });
      }
    }

    if (isDefault) {
      await prisma.workOrderPriority.updateMany({
        where: { companyId, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.workOrderPriority.update({
      where: { id },
      data: {
        name: name?.trim() || existingPriority.name,
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        color: color || '#6B7280',
        order: order ?? 0,
        isDefault: isDefault ?? false,
        isActive: isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        color: true,
        order: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/work-order-priorities/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الأولوية' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId;

    const existingPriority = await prisma.workOrderPriority.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        workOrders: { take: 1, select: { id: true } },
      },
    });
    if (!existingPriority) {
      return NextResponse.json({ error: 'الأولوية غير موجودة' }, { status: 404 });
    }

    if (existingPriority.workOrders.length > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الأولوية لأنها مستخدمة في أوامر عمل موجودة' },
        { status: 409 }
      );
    }

    await prisma.workOrderPriority.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الأولوية بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/work-order-priorities/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الأولوية' },
      { status: 500 }
    );
  }
}