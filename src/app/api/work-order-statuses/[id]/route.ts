// src/app/api/work-order-statuses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب حالة واحدة
// ============================================================
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

    const status = await prisma.workOrderStatus.findFirst({
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

    if (!status) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error in GET /api/work-order-statuses/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الحالة' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - تحديث حالة
// ============================================================
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

    const existingStatus = await prisma.workOrderStatus.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existingStatus) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    if (name?.trim()) {
      const duplicate = await prisma.workOrderStatus.findFirst({
        where: {
          companyId,
          name: name.trim(),
          deletedAt: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'هناك حالة بنفس الاسم بالفعل' }, { status: 409 });
      }
    }

    if (isDefault) {
      await prisma.workOrderStatus.updateMany({
        where: { companyId, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.workOrderStatus.update({
      where: { id },
      data: {
        name: name?.trim() || existingStatus.name,
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
    console.error('Error in PUT /api/work-order-statuses/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الحالة' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - حذف حالة (ناعم)
// ============================================================
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

    const existingStatus = await prisma.workOrderStatus.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        workOrders: { take: 1, select: { id: true } },
      },
    });
    if (!existingStatus) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    if (existingStatus.workOrders.length > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الحالة لأنها مستخدمة في أوامر عمل موجودة' },
        { status: 409 }
      );
    }

    await prisma.workOrderStatus.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الحالة بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/work-order-statuses/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الحالة' },
      { status: 500 }
    );
  }
}