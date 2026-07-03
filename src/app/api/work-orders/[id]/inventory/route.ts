// src/app/api/work-orders/[id]/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ===================== GET =====================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة بالمستخدم" },
        { status: 400 }
      );
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!workOrder) {
      return NextResponse.json({ error: "أمر العمل غير موجود" }, { status: 404 });
    }

    const items = await prisma.workOrderInventory.findMany({
      where: { workOrderId: id },
      include: { inventoryItem: true },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/work-orders/[id]/inventory error:", error);
    return NextResponse.json({ error: "خطأ في جلب القطع" }, { status: 500 });
  }
}

// ===================== POST =====================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { inventoryItemId, quantity, notes } = body;

    if (!inventoryItemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة بالمستخدم" },
        { status: 400 }
      );
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!workOrder) {
      return NextResponse.json({ error: "أمر العمل غير موجود" }, { status: 404 });
    }

    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, companyId, deletedAt: null },
    });
    if (!inventoryItem) {
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 });
    }
    if (inventoryItem.quantity < quantity) {
      return NextResponse.json({ error: "الكمية المطلوبة أكبر من المتوفر" }, { status: 400 });
    }

    // ✅ إزالة النوع الصريح لـ tx، وترك TypeScript يستنتجه
    const result = await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { quantity: { decrement: quantity } },
      });
      const workOrderInventory = await tx.workOrderInventory.create({
        data: {
          workOrderId: id,
          inventoryItemId,
          quantity,
          notes: notes || null,
        },
        include: { inventoryItem: true },
      });
      return workOrderInventory;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/work-orders/[id]/inventory error:", error);
    const message = error instanceof Error ? error.message : "فشل إضافة القطعة";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ===================== DELETE =====================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json({ error: "معرف السجل (recordId) مطلوب" }, { status: 400 });
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة بالمستخدم" },
        { status: 400 }
      );
    }

    const record = await prisma.workOrderInventory.findFirst({
      where: {
        id: recordId,
        workOrder: {
          id: id,
          companyId: companyId,
          deletedAt: null,
        },
      },
      include: { inventoryItem: true },
    });

    if (!record) {
      return NextResponse.json({ error: "السجل غير موجود أو لا يخص هذا الأمر" }, { status: 404 });
    }

    // ✅ إزالة النوع الصريح لـ tx هنا أيضاً
    await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: record.inventoryItemId },
        data: { quantity: { increment: record.quantity } },
      });
      await tx.workOrderInventory.delete({
        where: { id: record.id },
      });
    });

    return NextResponse.json({ message: "تم حذف القطعة وإعادة الكمية" });
  } catch (error: unknown) {
    console.error("DELETE /api/work-orders/[id]/inventory error:", error);
    const message = error instanceof Error ? error.message : "فشل حذف القطعة";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}