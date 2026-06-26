// src/app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";


import { getAuthenticatedSession, checkPermission } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';



import { uploadFileToR2 } from "@/lib/storage";

// ========== دالة توليد كود فريد لكل فرع ==========
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
      if (error.code === "P2002" && attempt < maxRetries) {
        console.log(`⚠️ تعارض في الترقيم، إعادة المحاولة ${attempt + 1}...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error("فشل إنشاء التذكرة بعد عدة محاولات");
}

// ========== GET ==========
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await checkPermission("tickets.read");

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

    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

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

    if (status && status !== "all") {
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

          // ✅ التعديل المطلوب
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
    return NextResponse.json(
      { error: "خطأ في جلب التذاكر" },
      { status: 500 }
    );
  }
}

// ========== POST ==========
export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession();
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
        { error: "بيانات ناقصة" },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة بالمستخدم" },
        { status: 400 }
      );
    }

    const ticket = await createTicketWithRetry({
      type: type === "INCIDENT" ? "INCIDENT" : "MAINTENANCE",
      title,
      description,
      reporterName,
      reporterEmail,
      phone: phone || null,
      companyId,
      roomId,
      branchId,
      assetId: assetId || null,
      createdBy: session.user.id,
      status: "PENDING",
    });

    const attachments = [];

    for (const file of imageFiles) {
      if (!file.type.startsWith("image/")) continue;

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
      });

      attachments.push(attachment);
    }

    return NextResponse.json(
      { ...ticket, attachments },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST_TICKET_ERROR:", error);

    return NextResponse.json(
      { error: error.message || "خطأ أثناء إنشاء التذكرة" },
      { status: 500 }
    );
  }
}