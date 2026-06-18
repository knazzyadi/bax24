// src/app/api/work-orders/[id]/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma, TxClient } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

// ===================== GET =====================
// جلب جميع قطع الغيار المرتبطة بأمر العمل
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("work_orders.read", session);

    const { id } = await params;
    const companyId = session.user.companyId;

    // ✅ التحقق من وجود companyId
    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة بالمستخدم" },
        { status: 400 }
      );
    }

    // التأكد من وجود أمر العمل للشركة
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
// إضافة قطعة غيار جديدة (مع خصم من المخزون)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("work_orders.update", session);

    const { id } = await params;
    const body = await req.json();
    const { inventoryItemId, quantity, notes } = body;

    if (!inventoryItemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const companyId = session.user.companyId;

    // ✅ التحقق من وجود companyId
    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة بالمستخدم" },
        { status: 400 }
      );
    }

    // التحقق من وجود أمر العمل
    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!workOrder) {
      return NextResponse.json({ error: "أمر العمل غير موجود" }, { status: 404 });
    }

    // التحقق من وجود الصنف في المخزون وتوفر الكمية
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, companyId, deletedAt: null },
    });
    if (!inventoryItem) {
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 });
    }
    if (inventoryItem.quantity < quantity) {
      return NextResponse.json({ error: "الكمية المطلوبة أكبر من المتوفر" }, { status: 400 });
    }

    // استخدام المعاملة (Transaction) لضمان الاتساق
    const result = await prisma.$transaction(async (tx: TxClient) => {
      // خصم الكمية من المخزون
      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { quantity: { decrement: quantity } },
      });
      // إنشاء سجل الربط
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
  } catch (error) {
    console.error("POST /api/work-orders/[id]/inventory error:", error);
    return NextResponse.json({ error: "فشل إضافة القطعة" }, { status: 500 });
  }
}

// ===================== DELETE =====================
// حذف قطعة غيار (إعادة الكمية إلى المخزون) باستخدام معرف سجل الربط (recordId)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("work_orders.update", session);

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json({ error: "معرف السجل (recordId) مطلوب" }, { status: 400 });
    }

    const companyId = session.user.companyId;

    // ✅ التحقق من وجود companyId
    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة بالمستخدم" },
        { status: 400 }
      );
    }

    // جلب سجل الربط مع التحقق من أنه يخص أمر العمل الصحيح والشركة
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

    // استخدام المعاملة لإعادة الكمية وحذف السجل
    await prisma.$transaction(async (tx: TxClient) => {
      // إعادة الكمية إلى المخزون
      await tx.inventoryItem.update({
        where: { id: record.inventoryItemId },
        data: { quantity: { increment: record.quantity } },
      });
      // حذف سجل الربط
      await tx.workOrderInventory.delete({
        where: { id: record.id },
      });
    });

    return NextResponse.json({ message: "تم حذف القطعة وإعادة الكمية" });
  } catch (error) {
    console.error("DELETE /api/work-orders/[id]/inventory error:", error);
    return NextResponse.json({ error: "فشل حذف القطعة" }, { status: 500 });
  }
}