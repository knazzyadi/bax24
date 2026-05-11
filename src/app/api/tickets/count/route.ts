// src/app/api/tickets/count/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("tickets.read", session);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    const userBranchIds = session.user.branchIds || [];

    // بناء شرط where الأساسي
    const where: any = {
      companyId,
      status: status,
      deletedAt: null,
    };

    // فلترة الفروع (إذا لم يكن المستخدم أدمن)
    if (!isAdmin) {
      if (userBranchIds.length === 0) {
        // لا فروع مسموحة -> صفر بلاغات
        return NextResponse.json({ count: 0 });
      }
      // إضافة شرط أن التذكرة تنتمي إلى فرع من فروع المستخدم
      where.branchId = { in: userBranchIds };
    }

    const count = await prisma.ticket.count({ where });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching pending tickets count:", error);
    return NextResponse.json({ error: "خطأ في جلب العدد" }, { status: 500 });
  }
}