import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await requirePermission("tickets.read", session);

    const { id } = await params;
    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        asset: { include: { type: true } },
        room: { include: { floor: { include: { building: true } } } },
        branch: true,
        ticketImages: true,
        workOrder: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("GET /api/tickets/[id] error:", error);
    return NextResponse.json({ error: "خطأ في جلب التذكرة" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await requirePermission("tickets.update", session);

    const { id } = await params;
    const body = await request.json();
    const companyId = session.user.companyId;

    // دعم status أو action
    let newStatus = body.status;
    if (!newStatus && body.action === "APPROVED") newStatus = "APPROVED";
    if (!newStatus && body.action === "REJECTED") newStatus = "REJECTED";

    const rejectionReason = body.rejectionReason || body.reason;

    const existingTicket = await prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    let dataToUpdate: any = {};

    // ================================
    // ✅ تحديث الحالة
    // ================================
    if (newStatus) {
      dataToUpdate.status = newStatus;

      // ❌ رفض
      if (newStatus === "REJECTED") {
        if (!rejectionReason) {
          return NextResponse.json(
            { error: "سبب الرفض مطلوب" },
            { status: 400 }
          );
        }
        dataToUpdate.rejectionReason = rejectionReason;
      }

      // ✅ قبول
      if (newStatus === "APPROVED") {
        // تحقق هل يوجد WorkOrder مسبق
        const existingWorkOrder = await prisma.workOrder.findUnique({
          where: { ticketId: existingTicket.id },
        });

        if (!existingWorkOrder) {
          const defaultStatus = await prisma.workOrderStatus.findFirst({
            where: { companyId, isDefault: true },
          });

          const defaultPriority = await prisma.workOrderPriority.findFirst({
            where: { companyId, isDefault: true },
          });

          // حماية من القيم الفارغة
          if (!defaultStatus || !defaultPriority) {
            return NextResponse.json(
              {
                error:
                  "يجب تحديد حالة افتراضية وأولوية افتراضية لأوامر العمل",
              },
              { status: 400 }
            );
          }

          await prisma.workOrder.create({
            data: {
              title: existingTicket.title,
              description: existingTicket.description,
              type:
                existingTicket.type === "INCIDENT"
                  ? "CORRECTIVE"
                  : "MAINTENANCE",
              priorityId: defaultPriority.id,
              statusId: defaultStatus.id,
              roomId: existingTicket.roomId,
              branchId: existingTicket.branchId,
              companyId,
              createdBy: session.user.id,
              ticketId: existingTicket.id, // ✅ الربط الصحيح
            },
          });
        }
      }
    } else {
      // تحديث بيانات أخرى
      const { title, description, ...rest } = body;

      if (title !== undefined) dataToUpdate.title = title;
      if (description !== undefined) dataToUpdate.description = description;

      Object.assign(dataToUpdate, rest);
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { ...dataToUpdate, updatedAt: new Date() },
    });

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error("🔥 PUT /api/tickets/[id] error:", error);

    return NextResponse.json(
      {
        error: error.message || "فشل تحديث التذكرة",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await requirePermission("tickets.delete", session);

    const { id } = await params;
    const companyId = session.user.companyId;

    const existing = await prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    await prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "تم حذف التذكرة" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "فشل حذف التذكرة" }, { status: 500 });
  }
}