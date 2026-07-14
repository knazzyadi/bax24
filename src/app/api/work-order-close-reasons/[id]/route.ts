// src/app/api/work-order-close-reasons/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب سبب إغلاق واحد
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

    const reason = await prisma.workOrderCloseReason.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        order: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!reason) {
      return NextResponse.json({ error: 'سبب الإغلاق غير موجود' }, { status: 404 });
    }

    return NextResponse.json(reason);
  } catch (error) {
    console.error('Error in GET /api/work-order-close-reasons/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سبب الإغلاق' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - تحديث سبب إغلاق
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
    const { name, nameEn, code, description, order, isDefault, isActive } = body;

    const existingReason = await prisma.workOrderCloseReason.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existingReason) {
      return NextResponse.json({ error: 'سبب الإغلاق غير موجود' }, { status: 404 });
    }

    if (name?.trim()) {
      const duplicate = await prisma.workOrderCloseReason.findFirst({
        where: {
          companyId,
          name: name.trim(),
          deletedAt: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'هناك سبب بنفس الاسم بالفعل' }, { status: 409 });
      }
    }

    if (isDefault) {
      await prisma.workOrderCloseReason.updateMany({
        where: { companyId, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.workOrderCloseReason.update({
      where: { id },
      data: {
        name: name?.trim() || existingReason.name,
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        description: description?.trim() || null,
        order: order ?? 0,
        isDefault: isDefault ?? false,
        isActive: isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        order: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/work-order-close-reasons/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث سبب الإغلاق' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - حذف سبب إغلاق (ناعم)
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

    // ✅ التحقق من وجود السبب فقط (بدون include)
    const existingReason = await prisma.workOrderCloseReason.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true },
    });

    if (!existingReason) {
      return NextResponse.json({ error: 'سبب الإغلاق غير موجود' }, { status: 404 });
    }

    // ✅ حذف ناعم مباشرة
    await prisma.workOrderCloseReason.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'تم حذف سبب الإغلاق بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/work-order-close-reasons/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف سبب الإغلاق' },
      { status: 500 }
    );
  }
}