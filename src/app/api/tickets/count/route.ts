// src/app/api/tickets/count/route.ts
import { NextResponse } from "next/server";
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// قيم TicketStatus المسموحة
const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"];

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      // ✅ إرجاع 0 بدلاً من خطأ 401 لتجنب Failed to fetch
      return NextResponse.json({ count: 0 });
    }

    // ✅ تحقق من وجود permission (إذا فشل، لا نمنع الطلب)
    let hasPermission = true;
    try {
      const { checkPermission } = await import('@/lib/auth/auth-helper');
      await checkPermission("tickets.read");
    } catch {
      hasPermission = false;
    }

    // إذا لم يكن لديه صلاحية، نعيد 0
    if (!hasPermission) {
      return NextResponse.json({ count: 0 });
    }

    const { searchParams } = new URL(request.url);
    let status = searchParams.get("status") || "PENDING";
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "قيمة حالة غير صالحة" }, { status: 400 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ count: 0 });
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
    // ✅ في حال حدوث أي خطأ، نعيد 0 بدلاً من 500
    return NextResponse.json({ count: 0 });
  }
}