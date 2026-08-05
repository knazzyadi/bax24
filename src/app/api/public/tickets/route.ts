// src/app/api/public/tickets/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFileToR2 } from "@/lib/storage";
import type { Prisma, TicketType, TicketStatus } from "@prisma/client";

// ======================
// Types
// ======================

type PrismaError = {
  code?: string;
  message?: string;
};

// ======================
// Rate Limit
// ======================

const ipRequests = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 5;

  const timestamps = ipRequests.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    return true;
  }

  recent.push(now);
  ipRequests.set(ip, recent);
  return false;
}

// ======================
// Generate Ticket Code
// ======================

async function generateTicketCode(branchId: string): Promise<{
  code: string;
  branchSeqNum: number;
}> {
  const lastTicket = await prisma.ticket.findFirst({
    where: { branchId },
    orderBy: { branchSeqNum: "desc" },
    select: { branchSeqNum: true },
  });

  const nextNumber = (lastTicket?.branchSeqNum ?? 0) + 1;

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });

  const prefix = branch?.code ?? "BR";

  return {
    code: `${prefix}-${nextNumber.toString().padStart(4, "0")}`,
    branchSeqNum: nextNumber,
  };
}

// ======================
// Create Ticket Retry
// ======================

// ✅ نستخدم Omit لإزالة الحقول التي نولّدها بأنفسنا (code, branchSeqNum)
async function createTicketWithRetry(
  data: Omit<Prisma.TicketUncheckedCreateInput, 'code' | 'branchSeqNum'>,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { code, branchSeqNum } = await generateTicketCode(data.branchId);

      return await prisma.ticket.create({
        data: {
          ...data,
          code,
          branchSeqNum,
        },
      });
    } catch (error: unknown) {
      const prismaError = error as PrismaError;

      if (prismaError.code === "P2002" && attempt < maxRetries) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("فشل إنشاء التذكرة بعد عدة محاولات");
}

// ======================
// POST
// ======================

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (ip !== "unknown" && isRateLimited(ip)) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح من الطلبات" },
        { status: 429 }
      );
    }

    const formData = await req.formData();

    const slug = formData.get("slug")?.toString().trim();
    const token = formData.get("token")?.toString().trim();
    const roomId = formData.get("roomId")?.toString();
    const title = formData.get("title")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const reporterName = formData.get("reporterName")?.toString().trim();
    const reporterEmail = formData.get("reporterEmail")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const typeRaw = formData.get("type")?.toString();
    const assetId = formData.get("assetId")?.toString();
    const imageFiles = formData.getAll("images").filter((file): file is File => file instanceof File);

    // ======================
    // Validation
    // ======================

    if (!slug || !token) {
      return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 });
    }

    if (!title || !roomId || !reporterName || !reporterEmail) {
      return NextResponse.json({ error: "البيانات الأساسية ناقصة" }, { status: 400 });
    }

    if (title.length < 5) {
      return NextResponse.json({ error: "عنوان البلاغ قصير جداً" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reporterEmail)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    }

    // ======================
    // Branch Validation
    // ======================

    const branch = await prisma.branch.findFirst({
      where: {
        slug,
        publicToken: token,
        allowPublicTickets: true,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!branch) {
      return NextResponse.json({ error: "الرابط غير صالح أو غير مفعل" }, { status: 403 });
    }

    // ======================
    // Room Validation
    // ======================

    const room = await prisma.room.findFirst({
      where: { id: roomId },
      select: {
        id: true,
        floor: {
          select: {
            building: {
              select: {
                branchId: true,
              },
            },
          },
        },
      },
    });

    if (!room || room.floor.building.branchId !== branch.id) {
      return NextResponse.json({ error: "الغرفة غير تابعة لهذا الفرع" }, { status: 400 });
    }

    // ======================
    // Type Validation
    // ======================

    const allowedTypes: readonly TicketType[] = ["MAINTENANCE", "INCIDENT"];
    const type = allowedTypes.includes(typeRaw as TicketType)
      ? (typeRaw as TicketType)
      : "MAINTENANCE";

    // ======================
    // Create Ticket
    // ======================

    const ticket = await createTicketWithRetry({
      title,
      description: description || null,
      type,
      roomId,
      assetId: assetId || null,
      reporterName,
      reporterEmail,
      phone: phone || null,
      companyId: branch.companyId,
      branchId: branch.id,
      status: "PENDING" as TicketStatus,
    });

    // ======================
    // Upload Attachments
    // ======================

    const attachments: Array<{ id: string; url: string }> = [];

    for (const file of imageFiles) {
      if (!file.type.startsWith("image/")) {
        continue;
      }

      try {
        const uploaded = await uploadFileToR2(file, `tickets/${ticket.id}`);

        const attachment = await prisma.ticketAttachment.create({
          data: {
            ticketId: ticket.id,
            url: uploaded.url,
            key: uploaded.key,
            provider: "CLOUDFLARE_R2",
            mimeType: uploaded.mimeType,
            size: uploaded.size,
            originalName: uploaded.originalName,
          },
          select: {
            id: true,
            url: true,
          },
        });

        attachments.push(attachment);
      } catch (error: unknown) {
        console.error("R2 Upload Failed:", error);
      }
    }

    // ======================
    // Response
    // ======================

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      code: ticket.code,
      attachments,
    });
  } catch (error: unknown) {
    console.error("PUBLIC_TICKET_ERROR:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: message || "فشل إنشاء البلاغ",
      },
      { status: 500 }
    );
  }
}