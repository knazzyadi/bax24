// src/app/api/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// ========== أنواع الـ Enums المسموحة (لضمان السلامة) ==========
const allowedTicketTypes = ["MAINTENANCE", "INCIDENT"];
const allowedTicketStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"];

// ========== Helper: حفظ الصورة ==========
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function saveImage(
  file: File,
  oldImageUrl?: string | null
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("الصورة كبيرة جدًا (الحد الأقصى 5 ميجابايت)");
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("نوع الملف غير مدعوم، يرجى رفع صورة (JPEG, PNG, WebP, GIF)");
  }

  if (oldImageUrl) {
    const oldPath = path.join(process.cwd(), "public", oldImageUrl);
    try { await unlink(oldPath); } catch {}
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".jpg";
  const fileName = `${randomUUID()}${ext}`;
  const relativePath = `/uploads/tickets/${fileName}`;
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  return relativePath;
}

// ===========================
// GET - Fetch single ticket
// ===========================
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
      return NextResponse.json(
        { error: "التذكرة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...ticket,
      imageUrl: ticket.imageUrl || null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "خطأ في جلب التذكرة" },
      { status: 500 }
    );
  }
}

// ===========================
// PUT - Update ticket (multipart/form-data or JSON)
// ===========================
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
    const companyId = session.user.companyId;

    const existingTicket = await prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: "التذكرة غير موجودة" },
        { status: 404 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let dataToUpdate: any = { updatedAt: new Date() };
    let newImageUrl: string | null | undefined = undefined;

    // ========== Case 1: multipart/form-data (with file upload) ==========
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

      // رفع / حذف الصورة
      if (file && file.size > 0) {
        try {
          newImageUrl = await saveImage(file, existingTicket.imageUrl);
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
      } else if (removeImage === "true") {
        if (existingTicket.imageUrl) {
          const oldPath = path.join(process.cwd(), "public", existingTicket.imageUrl);
          try { await unlink(oldPath); } catch {}
        }
        newImageUrl = null;
      }

      // التحقق من صحة الـ type (يجب أن يكون من ضمن TicketType)
      if (type) {
        if (!allowedTicketTypes.includes(type)) {
          return NextResponse.json({ error: "نوع التذكرة غير صالح" }, { status: 400 });
        }
        dataToUpdate.type = type;
      }
      // التحقق من صحة الـ status قبل التحديث
      let newStatus = status;
      if (!newStatus && action === "APPROVED") newStatus = "APPROVED";
      if (!newStatus && action === "REJECTED") newStatus = "REJECTED";

      if (newStatus) {
        if (newStatus !== "REJECTED" && newStatus !== "APPROVED") {
          if (!allowedTicketStatuses.includes(newStatus)) {
            return NextResponse.json({ error: "حالة التذكرة غير صالحة" }, { status: 400 });
          }
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
              return NextResponse.json(
                { error: "Missing default work order config" },
                { status: 400 }
              );
            }
            // تحديد نوع أمر العمل بناءً على نوع التذكرة (enum)
            const workOrderType = existingTicket.type === "INCIDENT" ? "CORRECTIVE" : "MAINTENANCE";
            await prisma.workOrder.create({
              data: {
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
              },
            });
          }
        }
      }

      // الحقول النصية العادية
      if (title) dataToUpdate.title = title;
      if (description) dataToUpdate.description = description;
      if (roomId) dataToUpdate.roomId = roomId;
      if (assetId) dataToUpdate.assetId = assetId || null;
      if (reporterName) dataToUpdate.reporterName = reporterName;
      if (reporterEmail) dataToUpdate.reporterEmail = reporterEmail;
      if (phone) dataToUpdate.phone = phone || null;
      if (newImageUrl !== undefined) dataToUpdate.imageUrl = newImageUrl;
    }
    // ========== Case 2: application/json (no file upload) ==========
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

      // دعم حذف الصورة
      if (body.removeImage === true && existingTicket.imageUrl) {
        const oldPath = path.join(process.cwd(), "public", existingTicket.imageUrl);
        try { await unlink(oldPath); } catch {}
        dataToUpdate.imageUrl = null;
      }

      // معالجة الحالة (status أو action)
      let newStatus = body.status;
      if (!newStatus && body.action === "APPROVED") newStatus = "APPROVED";
      if (!newStatus && body.action === "REJECTED") newStatus = "REJECTED";

      if (newStatus) {
        if (newStatus !== "REJECTED" && newStatus !== "APPROVED") {
          if (!allowedTicketStatuses.includes(newStatus)) {
            return NextResponse.json({ error: "حالة التذكرة غير صالحة" }, { status: 400 });
          }
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
              return NextResponse.json(
                { error: "Missing default work order config" },
                { status: 400 }
              );
            }
            const workOrderType = existingTicket.type === "INCIDENT" ? "CORRECTIVE" : "MAINTENANCE";
            await prisma.workOrder.create({
              data: {
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
              },
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
    });

    return NextResponse.json({
      ...updatedTicket,
      imageUrl: updatedTicket.imageUrl || null,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "فشل التحديث" },
      { status: 500 }
    );
  }
}

// ===========================
// DELETE - Soft delete
// ===========================
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

    if (existing.imageUrl) {
      const imagePath = path.join(process.cwd(), "public", existing.imageUrl);
      try { await unlink(imagePath); } catch {}
    }

    await prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "تم الحذف" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
  }
}