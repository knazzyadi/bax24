// src/app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ========== دالة توليد كود فريد ==========
async function generateTicketCode(companyId: string): Promise<string> {
  const prefix = "TCK";
  const lastTicket = await prisma.ticket.findFirst({
    where: { companyId },
    orderBy: { code: "desc" }, // ✅ الأفضل استخدام code بدلاً من createdAt
    select: { code: true },
  });
  let nextNumber = 1;
  if (lastTicket?.code) {
    const match = lastTicket.code.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0]) + 1;
  }
  return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
}

// ========== دالة إنشاء التذكرة مع إعادة المحاولة ==========
async function createTicketWithRetry(data: any, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const code = await generateTicketCode(data.companyId);
      const ticket = await prisma.ticket.create({
        data: { ...data, code },
      });
      return ticket;
    } catch (error: any) {
      // إذا كان الخطأ بسبب تكرار الكود (P2002) ولم نصل لأقصى محاولات، أعد المحاولة
      if (error.code === 'P2002' && error.meta?.target?.includes('code') && attempt < maxRetries) {
        console.log(`⚠️ Duplicate code, retrying (attempt ${attempt + 1})...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("فشل إنشاء التذكرة بعد عدة محاولات");
}

// ========== GET: جلب التذاكر ==========
export async function GET(request: NextRequest) {
  // ... (نفس الكود الأصلي، لا تغيير)
}

// ========== POST: إنشاء تذكرة جديدة ==========
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const formData = await request.formData();
    const type = formData.get("type") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const roomId = formData.get("roomId") as string;
    const branchId = formData.get("branchId") as string;
    const assetId = formData.get("assetId") as string;
    const reporterName = formData.get("reporterName") as string;
    const reporterEmail = formData.get("reporterEmail") as string;
    const phone = formData.get("phone") as string;
    const imageFiles = formData.getAll("images") as File[];

    if (!title || !description || !reporterName || !reporterEmail || !roomId || !branchId) {
      return NextResponse.json(
        { error: "بيانات ناقصة (العنوان، الوصف، المبلغ، الغرفة، الفرع)" },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة بالمستخدم" }, { status: 400 });
    }

    const room = await prisma.room.findFirst({
      where: { id: roomId },
      include: { floor: { include: { building: true } } },
    });
    if (!room) {
      return NextResponse.json({ error: "الغرفة غير موجودة" }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });
    if (!branch) {
      return NextResponse.json({ error: "الفرع غير موجود أو لا يتبع شركتك" }, { status: 400 });
    }

    // تحضير بيانات التذكرة (بدون code)
    const ticketData = {
      type: type === "INCIDENT" ? "INCIDENT" : "MAINTENANCE",
      title,
      description,
      reporterName,
      reporterEmail,
      phone: phone || null,
      companyId,
      roomId,
      branchId,
      assetId: assetId && assetId !== "none" && assetId !== "" ? assetId : null,
      createdBy: session.user.id,
      status: "PENDING",
    };

    // ✅ إنشاء التذكرة مع إعادة المحاولة التلقائية
    const ticket = await createTicketWithRetry(ticketData);

    // رفع الصور
    const uploadDir = path.join(process.cwd(), "public/uploads/tickets");
    await mkdir(uploadDir, { recursive: true });
    const savedImages = [];

    for (const file of imageFiles) {
      if (!file.type.startsWith("image/")) continue;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name);
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);
      const imageUrl = `/uploads/tickets/${uniqueName}`;
      const saved = await prisma.ticketImage.create({
        data: { ticketId: ticket.id, url: imageUrl },
      });
      savedImages.push(saved);
    }

    return NextResponse.json(
      { ...ticket, images: savedImages },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST_TICKET_ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء التذكرة" },
      { status: 500 }
    );
  }
}