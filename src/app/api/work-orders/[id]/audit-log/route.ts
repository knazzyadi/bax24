// src/app/api/work-orders/[id]/audit-log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // التحقق من وجود أمر العمل وصلاحية الشركة
    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id,
        companyId: session.companyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    // جلب سجل التدقيق من قاعدة البيانات
    // ✅ تأكد من أن نموذج AuditLog موجود في Prisma
    const logs = await prisma.auditLog.findMany({
      where: {
        workOrderId: id,
        companyId: session.companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}