// src/app/api/public/tickets/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, access } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// ======================
// Rate Limit (Simple In-Memory)
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
// Image Validation & Saving
// ======================
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

async function saveImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("حجم الصورة أكبر من 5MB");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("نوع الصورة غير مدعوم");
  }

  // حماية إضافية
  if (
    file.name.includes(".php") ||
    file.name.includes(".exe") ||
    file.name.includes(".js")
  ) {
    throw new Error("اسم ملف غير مسموح");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const ext = path.extname(file.name) || ".jpg";

  const fileName = `${randomUUID()}${ext}`;

  const relativePath = `/uploads/tickets/${fileName}`;

  const absolutePath = path.join(
    process.cwd(),
    "public",
    relativePath
  );

  // التأكد من وجود المجلد (إنشاء إذا لم يكن موجوداً)
  const dir = path.dirname(absolutePath);
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(absolutePath, buffer);

  return relativePath;
}

// ======================
// Generate unique ticket code (same as internal API)
// ======================
async function generateTicketCode(companyId: string): Promise<string> {
  const prefix = "TCK";
  const lastTicket = await prisma.ticket.findFirst({
    where: { companyId },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastTicket?.code) {
    const match = lastTicket.code.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }
  return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
}

// ======================
// POST - Public Ticket
// ======================
export async function POST(req: Request) {
  try {
    // ======================
    // IP Rate Limit
    // ======================
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح من الطلبات" },
        { status: 429 }
      );
    }

    const formData = await req.formData();

    // ======================
    // Inputs
    // ======================
    const slug = formData.get("slug")?.toString()?.trim();
    const token = formData.get("token")?.toString()?.trim();
    const roomId = formData.get("roomId")?.toString();
    const title = formData.get("title")?.toString()?.trim();
    const description = formData.get("description")?.toString()?.trim();
    const reporterName = formData.get("reporterName")?.toString()?.trim();
    const reporterEmail = formData.get("reporterEmail")?.toString()?.trim();
    const phone = formData.get("phone")?.toString()?.trim();
    const type = formData.get("type")?.toString() || "MAINTENANCE";
    const assetId = formData.get("assetId")?.toString();

    // ======================
    // Basic Validation
    // ======================
    if (!slug || !token) {
      return NextResponse.json(
        { error: "رابط غير صالح" },
        { status: 400 }
      );
    }

    if (!title || !roomId || !reporterName || !reporterEmail) {
      return NextResponse.json(
        { error: "البيانات الأساسية ناقصة" },
        { status: 400 }
      );
    }

    if (title.length < 5) {
      return NextResponse.json(
        { error: "عنوان البلاغ قصير جدًا" },
        { status: 400 }
      );
    }

    // ======================
    // Email validation
    // ======================
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reporterEmail)) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صالح" },
        { status: 400 }
      );
    }

    // ======================
    // Validate Branch
    // ======================
    const branch = await prisma.branch.findFirst({
      where: {
        slug,
        publicToken: token,
        allowPublicTickets: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "الرابط غير صالح أو غير مفعل" },
        { status: 403 }
      );
    }

    // ======================
    // Validate Room
    // ======================
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        floor: {
          building: {
            branchId: branch.id,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "الغرفة غير تابعة لهذا الفرع" },
        { status: 400 }
      );
    }

    // ======================
    // Validate type
    // ======================
    const allowedTypes = ["MAINTENANCE", "INCIDENT"];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: "نوع البلاغ غير مسموح" },
        { status: 400 }
      );
    }

    // ======================
    // Image Upload
    // ======================
    let imageUrl: string | null = null;
    const image = formData.get("image") as File | null;

    if (image && image.size > 0) {
      try {
        imageUrl = await saveImage(image);
        console.log("✅ Image saved:", imageUrl);
      } catch (err: any) {
        console.error("❌ Image upload error:", err.message);
        // لا نمنع إنشاء التذكرة إذا فشلت الصورة، نكمل بدونها
      }
    }

    // ======================
    // Generate unique code
    // ======================
    const code = await generateTicketCode(branch.companyId);

    // ======================
    // Create Ticket
    // ======================
    const ticket = await prisma.ticket.create({
      data: {
        code,                     // ✅ الكود الفريد
        title,
        description: description || null,
        type: type as any,
        roomId,
        assetId: assetId || null,
        reporterName,
        reporterEmail,
        phone: phone || null,
        imageUrl,
        companyId: branch.companyId,
        branchId: branch.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      imageUrl,
    });
  } catch (error: any) {
    console.error("PUBLIC_TICKET_ERROR:", error);
    return NextResponse.json(
      {
        error: error.message || "فشل إنشاء البلاغ",
      },
      { status: 500 }
    );
  }
}