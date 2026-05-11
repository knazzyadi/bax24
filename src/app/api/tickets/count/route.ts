// src/app/api/tickets/count/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

// قيم TicketStatus المسموحة
const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"];

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("tickets.read", session);

    const { searchParams } = new URL(request.url);
    let status = searchParams.get("status") || "PENDING";
    
    // التحقق من صحة قيمة status
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "قيمة حالة غير صالحة" }, { status: 400 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    const userBranchIds = session.user.branchIds || [];

    const where: any = {
      companyId,
      status,
      deletedAt: null,
    };

    if (!isAdmin) {
      if (userBranchIds.length === 0) {
        return NextResponse.json({ count: 0 });
      }
      where.branchId = { in: userBranchIds };
    }

    const count = await prisma.ticket.count({ where });
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching tickets count:", error);
    return NextResponse.json({ error: "خطأ في جلب العدد" }, { status: 500 });
  }
}