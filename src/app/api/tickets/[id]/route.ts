// src/app/api/tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { uploadFileToR2, deleteFileFromR2 } from "@/lib/storage";

// ========== أنواع الـ Enums المسموحة ==========
const allowedTicketTypes = ["MAINTENANCE", "INCIDENT"];
const allowedTicketStatuses = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

// ===========================
// GET - Fetch single ticket
// ===========================
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await requirePermission("tickets.read", session);

    const companyId = session.user.companyId;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.id,
        companyId,
        deletedAt: null,
      },
      include: {
        asset: { include: { type: true } },
        room: { include: { floor: { include: { building: true } } } },
        branch: true,

        // ✅ الإصلاح الأساسي هنا
        attachments: {
          select: {
            id: true,
            url: true,
            key: true,
            mimeType: true,
            size: true,
            originalName: true,
            provider: true,
            createdAt: true,
          },
        },

        workOrder: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "التذكرة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "خطأ في جلب التذكرة" },
      { status: 500 }
    );
  }
}

// ===========================
// PUT - Update ticket
// ===========================
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await requirePermission("tickets.update", session);

    const companyId = session.user.companyId;

    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id: params.id,
        companyId,
        deletedAt: null,
      },
      include: {
        attachments: true,
      },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: "التذكرة غير موجودة" },
        { status: 404 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    const dataToUpdate: any = { updatedAt: new Date() };

    // ===========================
    // Multipart FormData
    // ===========================
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const title = formData.get("title")?.toString();
      const description = formData.get("description")?.toString();
      const type = formData.get("type")?.toString();
      const roomId = formData.get("roomId")?.toString();
      const assetId = formData.get("assetId")?.toString();
      const phone = formData.get("phone")?.toString();

      const file = formData.get("file") as File | null;
      const removeImage = formData.get("removeImage")?.toString();

      // رفع ملف جديد
      if (file && file.size > 0) {
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

        // حذف القديم
        for (const att of existingTicket.attachments) {
          await deleteFileFromR2(att.key);
        }

        await prisma.ticketAttachment.deleteMany({
          where: { ticketId: existingTicket.id },
        });
      }

      // حذف كل المرفقات
      if (removeImage === "true") {
        for (const att of existingTicket.attachments) {
          await deleteFileFromR2(att.key);
        }

        await prisma.ticketAttachment.deleteMany({
          where: { ticketId: existingTicket.id },
        });
      }

      if (title) dataToUpdate.title = title;
      if (description) dataToUpdate.description = description;
      if (roomId) dataToUpdate.roomId = roomId;
      if (assetId) dataToUpdate.assetId = assetId || null;
      if (phone) dataToUpdate.phone = phone || null;

      if (type && allowedTicketTypes.includes(type)) {
        dataToUpdate.type = type;
      }
    }

    // ===========================
    // JSON Update
    // ===========================
    else if (contentType.includes("application/json")) {
      const body = await request.json();

      if (body.title !== undefined) dataToUpdate.title = body.title;
      if (body.description !== undefined) dataToUpdate.description = body.description;

      if (body.type && allowedTicketTypes.includes(body.type)) {
        dataToUpdate.type = body.type;
      }

      if (body.roomId !== undefined) dataToUpdate.roomId = body.roomId;
      if (body.assetId !== undefined) dataToUpdate.assetId = body.assetId || null;
      if (body.phone !== undefined) dataToUpdate.phone = body.phone || null;

      if (body.removeAllAttachments) {
        for (const att of existingTicket.attachments) {
          await deleteFileFromR2(att.key);
        }

        await prisma.ticketAttachment.deleteMany({
          where: { ticketId: existingTicket.id },
        });
      }
    } else {
      return NextResponse.json(
        { error: "Content-Type غير مدعوم" },
        { status: 415 }
      );
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        attachments: {
          select: {
            id: true,
            url: true,
            key: true,
            mimeType: true,
            size: true,
            originalName: true,
            provider: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTicket);
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await requirePermission("tickets.delete", session);

    const companyId = session.user.companyId;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.id,
        companyId,
        deletedAt: null,
      },
      include: {
        attachments: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "التذكرة غير موجودة" },
        { status: 404 }
      );
    }

    // حذف الملفات من R2 فقط
    for (const att of ticket.attachments) {
      await deleteFileFromR2(att.key);
    }

    await prisma.ticketAttachment.deleteMany({
      where: { ticketId: params.id },
    });

    await prisma.ticket.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      message: "تم حذف التذكرة بنجاح",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "فشل الحذف" },
      { status: 500 }
    );
  }
}