// src/app/api/tickets/count/route.ts
import { NextResponse } from "next/server";


import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';




// قيم TicketStatus المسموحة
const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"];

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await checkPermission("tickets.read");

    const { searchParams } = new URL(request.url);
    let status = searchParams.get("status") || "PENDING";
    
    // التحقق من صحة قيمة status
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "قيمة حالة غير صالحة" }, { status: 400 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
    const userBranchIds = session.branchIds || [];

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