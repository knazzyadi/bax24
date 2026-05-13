// src/app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { uploadFileToR2, deleteFileFromR2 } from "@/lib/storage";
import { createWorkOrderWithRetry } from "@/lib/generateCode"; // ✅ استيراد الدالة مع إعادة المحاولة

const allowedTicketTypes = ["MAINTENANCE", "INCIDENT"];
const allowedTicketStatuses = ["PENDING", "APPROVED", "REJECTED"];

// ===========================
// GET
// ===========================
export async function GET(
  request: NextRequest,
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

    const ticket = await prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        asset: { include: { type: true } },
        room: { include: { floor: { include: { building: true } } } },
        branch: true,
        attachments: true,
        workOrder: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في جلب التذكرة" }, { status: 500 });
  }
}

// ===========================
// PUT
// ===========================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("tickets.update", session);

    const { id } = await params;
    const companyId = session.user.companyId;

    const existingTicket = await prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { attachments: true },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";
    let dataToUpdate: any = { updatedAt: new Date() };

    // ========== multipart/form-data ==========
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const title = formData.get("title")?.toString();
      const description = formData.get("description")?.toString();
      let type = formData.get("type")?.toString();
      const roomId = formData.get("roomId")?.toString();
      const assetId = formData.get("assetId")?.toString();
      const reporterName = formData.get("reporterName")?.toString();
      const reporterEmail = formData.get("reporterEmail")?.toString();
      const phone = formData.get("phone")?.toString();
      let status = formData.get("status")?.toString();
      const action = formData.get("action")?.toString();
      const rejectionReason = formData.get("rejectionReason")?.toString() || formData.get("reason")?.toString();

      const file = formData.get("file") as File | null;
      const removeImage = formData.get("removeImage")?.toString();

      // رفع ملف جديد أو حذف المرفقات
      if (file && file.size > 0) {
        try {
          const uploaded = await uploadFileToR2(file, `tickets/${existingTicket.id}`);
          await prisma.ticketAttachment.create({
            data: {
              ticketId: existingTicket.id,
              url: uploaded.url,
              key: uploaded.key,
              provider: "CLOUDFLARE_R2",
              mimeType: uploaded.mimeType,
              size: uploaded.size,
              originalName: uploaded.originalName,
            },
          });
          // حذف المرفقات القديمة
          for (const oldAtt of existingTicket.attachments) {
            await deleteFileFromR2(oldAtt.key);
            await prisma.ticketAttachment.delete({ where: { id: oldAtt.id } });
          }
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
      } else if (removeImage === "true") {
        for (const att of existingTicket.attachments) {
          await deleteFileFromR2(att.key);
          await prisma.ticketAttachment.delete({ where: { id: att.id } });
        }
      }

      // التحقق من type و status
      if (type && !allowedTicketTypes.includes(type)) {
        return NextResponse.json({ error: "نوع التذكرة غير صالح" }, { status: 400 });
      }
      if (type) dataToUpdate.type = type;

      let newStatus = status;
      if (!newStatus && action === "APPROVED") newStatus = "APPROVED";
      if (!newStatus && action === "REJECTED") newStatus = "REJECTED";

      if (newStatus) {
        if (!["APPROVED", "REJECTED"].includes(newStatus) && !allowedTicketStatuses.includes(newStatus)) {
          return NextResponse.json({ error: "حالة التذكرة غير صالحة" }, { status: 400 });
        }
        dataToUpdate.status = newStatus;
        if (newStatus === "REJECTED") {
          if (!rejectionReason) {
            return NextResponse.json({ error: "سبب الرفض مطلوب" }, { status: 400 });
          }
          dataToUpdate.rejectionReason = rejectionReason;
        }
        if (newStatus === "APPROVED") {
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
            if (!defaultStatus || !defaultPriority) {
              return NextResponse.json({ error: "Missing default work order config" }, { status: 400 });
            }
            const workOrderType = existingTicket.type === "INCIDENT" ? "CORRECTIVE" : "MAINTENANCE";
            // ✅ استخدام دالة الإنشاء مع إعادة المحاولة (تستخدم branchSeqNum)
            await createWorkOrderWithRetry({
              title: existingTicket.title,
              description: existingTicket.description,
              type: workOrderType,
              priorityId: defaultPriority.id,
              statusId: defaultStatus.id,
              roomId: existingTicket.roomId,
              branchId: existingTicket.branchId,
              companyId,
              createdBy: session.user.id,
              ticketId: existingTicket.id,
            });
          }
        }
      }

      if (title) dataToUpdate.title = title;
      if (description) dataToUpdate.description = description;
      if (roomId) dataToUpdate.roomId = roomId;
      if (assetId) dataToUpdate.assetId = assetId || null;
      if (reporterName) dataToUpdate.reporterName = reporterName;
      if (reporterEmail) dataToUpdate.reporterEmail = reporterEmail;
      if (phone) dataToUpdate.phone = phone || null;
    }
    // ========== application/json ==========
    else if (contentType.includes("application/json")) {
      const body = await request.json();

      if (body.title !== undefined) dataToUpdate.title = body.title;
      if (body.description !== undefined) dataToUpdate.description = body.description;
      if (body.type !== undefined) {
        if (!allowedTicketTypes.includes(body.type)) {
          return NextResponse.json({ error: "نوع التذكرة غير صالح" }, { status: 400 });
        }
        dataToUpdate.type = body.type;
      }
      if (body.roomId !== undefined) dataToUpdate.roomId = body.roomId;
      if (body.assetId !== undefined) dataToUpdate.assetId = body.assetId || null;
      if (body.reporterName !== undefined) dataToUpdate.reporterName = body.reporterName;
      if (body.reporterEmail !== undefined) dataToUpdate.reporterEmail = body.reporterEmail;
      if (body.phone !== undefined) dataToUpdate.phone = body.phone || null;

      if (body.removeAllAttachments === true && existingTicket.attachments.length) {
        for (const att of existingTicket.attachments) {
          await deleteFileFromR2(att.key);
          await prisma.ticketAttachment.delete({ where: { id: att.id } });
        }
      }

      let newStatus = body.status;
      if (!newStatus && body.action === "APPROVED") newStatus = "APPROVED";
      if (!newStatus && body.action === "REJECTED") newStatus = "REJECTED";

      if (newStatus) {
        if (!["APPROVED", "REJECTED"].includes(newStatus) && !allowedTicketStatuses.includes(newStatus)) {
          return NextResponse.json({ error: "حالة التذكرة غير صالحة" }, { status: 400 });
        }
        dataToUpdate.status = newStatus;
        if (newStatus === "REJECTED") {
          if (!body.rejectionReason && !body.reason) {
            return NextResponse.json({ error: "سبب الرفض مطلوب" }, { status: 400 });
          }
          dataToUpdate.rejectionReason = body.rejectionReason || body.reason;
        }
        if (newStatus === "APPROVED") {
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
            if (!defaultStatus || !defaultPriority) {
              return NextResponse.json({ error: "Missing default work order config" }, { status: 400 });
            }
            const workOrderType = existingTicket.type === "INCIDENT" ? "CORRECTIVE" : "MAINTENANCE";
            // ✅ استخدام دالة الإنشاء مع إعادة المحاولة (تستخدم branchSeqNum)
            await createWorkOrderWithRetry({
              title: existingTicket.title,
              description: existingTicket.description,
              type: workOrderType,
              priorityId: defaultPriority.id,
              statusId: defaultStatus.id,
              roomId: existingTicket.roomId,
              branchId: existingTicket.branchId,
              companyId,
              createdBy: session.user.id,
              ticketId: existingTicket.id,
            });
          }
        }
      }
    } else {
      return NextResponse.json({ error: "Content-Type غير مدعوم" }, { status: 415 });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: dataToUpdate,
      include: { attachments: true },
    });

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "فشل التحديث" }, { status: 500 });
  }
}

// ===========================
// DELETE
// ===========================
export async function DELETE(
  request: NextRequest,
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

    const existingTicket = await prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { attachments: true },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    // حذف المرفقات من R2
    for (const att of existingTicket.attachments) {
      await deleteFileFromR2(att.key);
    }
    await prisma.ticketAttachment.deleteMany({ where: { ticketId: id } });

    // Soft delete التذكرة
    await prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "تم حذف التذكرة وجميع مرفقاتها" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
  }
}