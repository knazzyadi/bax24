// src/app/api/tickets/count/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession, requirePermission } from '@/lib/auth/auth-helper'; // ✅
import { prisma } from '@/lib/prisma';

// قيم TicketStatus المسموحة
const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"];

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      // ✅ إرجاع 0 بدلاً من خطأ 401 لتجنب Failed to fetch
      return NextResponse.json({ count: 0 });
    }

    // ✅ تحقق من وجود permission (إذا فشل، لا نمنع الطلب)
    let hasPermission = true;
    try {
      await requirePermission("tickets.read"); // ✅ استخدم requirePermission
    } catch {
      hasPermission = false;
    }

    // إذا لم يكن لديه صلاحية، نعيد 0
    if (!hasPermission) {
      return NextResponse.json({ count: 0 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "قيمة حالة غير صالحة" }, { status: 400 });
    }

    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isAdmin = session.role === "ADMIN" || isSuperAdmin;
    const userBranchIds = session.branchIds || [];

    // ✅ بناء شرط where بشكل آمن
    const where: any = {
      status,
      deletedAt: null,
    };

    // ✅ فقط إذا لم يكن السوبر أدمن، نضيف فلترة companyId
    if (!isSuperAdmin) {
      if (!session.companyId) {
        return NextResponse.json({ count: 0 });
      }
      where.companyId = session.companyId;

      // ✅ فلترة الفروع للمستخدمين غير الإداريين
      if (!isAdmin) {
        if (userBranchIds.length === 0) {
          return NextResponse.json({ count: 0 });
        }
        where.branchId = { in: userBranchIds };
      }
    }

    const count = await prisma.ticket.count({ where });
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching tickets count:", error);
    // ✅ في حال حدوث أي خطأ، نعيد 0 بدلاً من 500
    return NextResponse.json({ count: 0 });
  }
}