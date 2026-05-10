import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

// GET: جلب جميع قطع الغيار المرتبطة بأمر العمل
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
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
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
    return NextResponse.json(items || []);
  } catch (error) {
    console.error("GET /api/work-orders/[id]/inventory error:", error);
    return NextResponse.json({ error: "خطأ في جلب القطع" }, { status: 500 });
  }
}

// POST: إضافة قطعة غيار جديدة (مع خصم من المخزون)
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

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
  } catch (error) {
    console.error("POST /api/work-orders/[id]/inventory error:", error);
    return NextResponse.json({ error: "فشل إضافة القطعة" }, { status: 500 });
  }
}

// DELETE: حذف قطعة (إعادة الكمية إلى المخزون)
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
    const inventoryItemId = searchParams.get("inventoryItemId");
    if (!inventoryItemId) {
      return NextResponse.json({ error: "معرف الصنف مطلوب" }, { status: 400 });
    }

    const companyId = session.user.companyId;

    const record = await prisma.workOrderInventory.findFirst({
      where: { workOrderId: id, inventoryItemId },
    });
    if (!record) {
      return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { quantity: { increment: record.quantity } },
      });
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