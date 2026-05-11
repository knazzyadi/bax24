// src/app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ========== دالة توليد كود فريد لكل فرع ==========
async function generateTicketCode(branchId: string): Promise<{ code: string; branchSeqNum: number }> {
  // الحصول على آخر رقم تسلسلي مستخدم في هذا الفرع
  const lastTicket = await prisma.ticket.findFirst({
    where: { branchId },
    orderBy: { branchSeqNum: "desc" },
    select: { branchSeqNum: true },
  });

  const nextNumber = (lastTicket?.branchSeqNum ?? 0) + 1;

  // الحصول على بادئة الفرع (اختصار مخزن في model Branch)
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });
  const prefix = branch?.code || "BR";

  const code = `${prefix}-${nextNumber.toString().padStart(4, "0")}`;

  return { code, branchSeqNum: nextNumber };
}

// ========== دالة إنشاء التذكرة مع إعادة المحاولة ==========
async function createTicketWithRetry(data: any, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { code, branchSeqNum } = await generateTicketCode(data.branchId);
      const ticket = await prisma.ticket.create({
        data: {
          ...data,
          code,
          branchSeqNum,
        },
      });
      return ticket;
    } catch (error: any) {
      if (error.code === 'P2002' && attempt < maxRetries) {
        console.log(`⚠️ تعارض في الترقيم، إعادة المحاولة ${attempt + 1}...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("فشل إنشاء التذكرة بعد عدة محاولات");
}

// ========== GET: جلب التذاكر مع دعم الفلترة والترقيم والفروع ==========
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("tickets.read", session);

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة بالمستخدم" }, { status: 400 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    const branchIds = session.user.branchIds || [];

    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (!isAdmin) {
      if (branchIds.length > 0) {
        where.branchId = { in: branchIds };
      } else {
        return NextResponse.json({
          items: [],
          total: 0,
          currentPage: page,
          totalPages: 0,
          limit,
        });
      }
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ];
    }

    // تحويل status من string إلى enum إذا كان موجوداً
    if (status && status !== "all") {
      // Prisma يقبل السلسلة النصية المطابقة لأعضاء الـ enum
      where.status = status;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          asset: { select: { id: true, name: true, code: true } },
          room: {
            include: {
              floor: {
                include: { building: true },
              },
            },
          },
          branch: true,
          ticketImages: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    const serializedTickets = tickets.map((ticket: any) => ({
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt?.toISOString(),
    }));

    return NextResponse.json({
      items: serializedTickets,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error: any) {
    console.error("GET /api/tickets error:", error);
    return NextResponse.json({ error: "خطأ في جلب التذاكر" }, { status: 500 });
  }
}

// ========== POST: إنشاء تذكرة جديدة مع رفع الصور ==========
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
        { error: "بيانات ناقصة (العنوان، الوصف، اسم المبلغ، البريد، الغرفة، الفرع)" },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة بالمستخدم" }, { status: 400 });
    }

    // التحقق من وجود الغرفة والفرع
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

    // تحويل `type` إلى قيمة enum المتوقعة
    let ticketType: "MAINTENANCE" | "INCIDENT" = "MAINTENANCE";
    if (type === "INCIDENT") {
      ticketType = "INCIDENT";
    } else {
      ticketType = "MAINTENANCE";
    }

    // تحضير بيانات التذكرة (بدون code و branchSeqNum)
    const ticketData = {
      type: ticketType,
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
      status: "PENDING",   // Prisma سيقبلها كـ string وتتحول تلقائياً إلى enum
    };

    // إنشاء التذكرة مع إعادة المحاولة (يضيف code و branchSeqNum)
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