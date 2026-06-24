// src/app/api/public/tickets/route.ts
import { NextResponse } from "next/server";


import { prisma } from '@/lib/prisma';
import { uploadFileToR2 } from "@/lib/storage";

// ======================
// Rate Limit (بسيط - مناسب كبداية، لاحقًا يفضل Redis)
// ======================
const ipRequests = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = 5;

  const timestamps = ipRequests.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= limit) return true;

  recent.push(now);
  ipRequests.set(ip, recent);
  return false;
}

// ======================
// توليد كود التذكرة (لكل فرع على حدة)
// ======================
async function generateTicketCode(branchId: string): Promise<{ code: string; branchSeqNum: number }> {
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

  const prefix = branch?.code || "BR";
  const code = `${prefix}-${nextNumber.toString().padStart(4, "0")}`;

  return { code, branchSeqNum: nextNumber };
}

// ======================
// إنشاء التذكرة مع إعادة المحاولة (لتجنب تضارب الأكواد)
// ======================
async function createTicketWithRetry(data: any, maxRetries = 3) {
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
    } catch (error: any) {
      if (error.code === "P2002" && attempt < maxRetries) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("فشل إنشاء التذكرة بعد عدة محاولات");
}

// ======================
// POST - Public Ticket Endpoint (يدعم صور متعددة)
// ======================
export async function POST(req: Request) {
  try {
    // ========== IP Rate Limit ==========
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (ip !== "unknown" && isRateLimited(ip)) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح من الطلبات" },
        { status: 429 }
      );
    }

    const formData = await req.formData();

    const slug = formData.get("slug")?.toString()?.trim();
    const token = formData.get("token")?.toString()?.trim();

    const roomId = formData.get("roomId")?.toString();
    const title = formData.get("title")?.toString()?.trim();
    const description = formData.get("description")?.toString()?.trim();

    const reporterName = formData.get("reporterName")?.toString()?.trim();
    const reporterEmail = formData.get("reporterEmail")?.toString()?.trim();
    const phone = formData.get("phone")?.toString()?.trim();

    const typeRaw = formData.get("type")?.toString();
    const assetId = formData.get("assetId")?.toString();
    const imageFiles = formData.getAll("images") as File[];   // ✅ تغيير جوهري: استقبال عدة صور

    // ======================
    // Validation أساسي
    // ======================
    if (!slug || !token) {
      return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 });
    }

    if (!title || !roomId || !reporterName || !reporterEmail) {
      return NextResponse.json(
        { error: "البيانات الأساسية ناقصة" },
        { status: 400 }
      );
    }

    if (title.length < 5) {
      return NextResponse.json(
        { error: "عنوان البلاغ قصير جداً" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reporterEmail)) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صالح" },
        { status: 400 }
      );
    }

    // ======================
    // Branch validation (مع select للأداء)
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
      return NextResponse.json(
        { error: "الرابط غير صالح أو غير مفعل" },
        { status: 403 }
      );
    }

    // ======================
    // Room validation (أكثر أماناً + select للأداء)
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

    // التحقق من صحة الغرفة وتبعيتها للفرع
    if (!room || room.floor.building.branchId !== branch.id) {
      return NextResponse.json(
        { error: "الغرفة غير تابعة لهذا الفرع" },
        { status: 400 }
      );
    }

    // ======================
    // Type validation
    // ======================
    const allowedTypes = ["MAINTENANCE", "INCIDENT"] as const;
    const type =
      typeRaw && allowedTypes.includes(typeRaw as any)
        ? typeRaw
        : "MAINTENANCE";

    // ======================
    // إنشاء التذكرة
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
      status: "PENDING",
    });

    // ======================
    // رفع الصور (عدة صور) إلى R2 وحفظها في TicketAttachment
    // ======================
    const attachments = [];

    for (const file of imageFiles) {
      if (!file.type.startsWith("image/")) continue;
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
      } catch (err) {
        console.error("R2 Upload Failed:", err);
      }
    }

    // ======================
    // Response نظيف للجمهور
    // ======================
    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      code: ticket.code,
      attachments,   // ✅ مصفوفة المرفقات
    });
  } catch (error: any) {
    console.error("PUBLIC_TICKET_ERROR:", error);

    return NextResponse.json(
      { error: "فشل إنشاء البلاغ" },
      { status: 500 }
    );
  }
}