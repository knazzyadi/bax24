// src/app/api/work-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { createWorkOrderWithRetry } from "@/lib/generateCode"; // ✅ استيراد دالة الإنشاء الآمنة

// ========== GET: جلب أوامر العمل مع دعم الفلترة والفروع ==========
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("work_orders.read", session);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const statusId = searchParams.get("statusId");
    const priorityId = searchParams.get("priorityId");
    const assetId = searchParams.get("assetId");
    const q = searchParams.get("q") || "";

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
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
        return NextResponse.json({ items: [], total: 0, currentPage: page, totalPages: 0, limit });
      }
    }

    if (statusId && statusId !== "all") where.statusId = statusId;
    if (priorityId && priorityId !== "all") where.priorityId = priorityId;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ];
    }
    if (assetId) {
      where.workOrderAssets = { some: { assetId } };
    }

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          priority: true,
          status: true,
          assetType: true,
          branch: true,
          room: { include: { floor: { include: { building: true } } } },
          workOrderAssets: {
            include: { asset: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ]);

    const serialized = workOrders.map((wo: any) => ({
      ...wo,
      createdAt: wo.createdAt.toISOString(),
      updatedAt: wo.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      items: serialized,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error("GET /api/work-orders error:", error);
    return NextResponse.json({ error: "خطأ في جلب أوامر العمل" }, { status: 500 });
  }
}

// ========== POST: إنشاء أمر عمل جديد (يدعم أصول متعددة) ==========
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("work_orders.create", session);

    const body = await request.json();
    const {
      title,
      description,
      type,
      priorityId,
      statusId,
      roomId,
      branchId,
      assetTypeId,
      notes,
      assetIds,
    } = body;

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    // التحقق من صلاحيات الفرع (لغير المديرين)
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    if (!isAdmin && branchId) {
      const userBranchIds = session.user.branchIds || [];
      if (!userBranchIds.includes(branchId)) {
        return NextResponse.json({ error: "لا تملك صلاحية إنشاء أمر عمل في هذا الفرع" }, { status: 403 });
      }
    }

    // جلب الحالة والأولوية الافتراضية إذا لم يتم إرسالها أو كانت غير صالحة
    let finalPriorityId = priorityId;
    let finalStatusId = statusId;

    if (!finalPriorityId || finalPriorityId === "all") {
      const defaultPriority = await prisma.workOrderPriority.findFirst({
        where: { companyId, isDefault: true },
      });
      if (defaultPriority) finalPriorityId = defaultPriority.id;
    } else {
      const exists = await prisma.workOrderPriority.findFirst({
        where: { id: finalPriorityId, companyId },
      });
      if (!exists) finalPriorityId = null;
    }

    if (!finalStatusId || finalStatusId === "all") {
      const defaultStatus = await prisma.workOrderStatus.findFirst({
        where: { companyId, isDefault: true },
      });
      if (defaultStatus) finalStatusId = defaultStatus.id;
    } else {
      const exists = await prisma.workOrderStatus.findFirst({
        where: { id: finalStatusId, companyId },
      });
      if (!exists) finalStatusId = null;
    }

    if (!finalPriorityId || !finalStatusId) {
      return NextResponse.json(
        { error: "لا توجد حالة أو أولوية افتراضية محددة. يرجى مراجعة إعدادات الشركة." },
        { status: 400 }
      );
    }

    // تحضير البيانات لإنشاء أمر العمل (بدون code و branchSeqNum)
    const workOrderData = {
      title,
      description,
      type: type || "MAINTENANCE",
      priorityId: finalPriorityId,
      statusId: finalStatusId,
      roomId: roomId || null,
      branchId: branchId || null,
      assetTypeId: assetTypeId || null,
      notes: notes || null,
      companyId,
      createdBy: session.user.id,
      ticketId: null, // لأنه إنشاء مباشر وليس من بلاغ
    };

    // ✅ استخدام الدالة الآمنة لإنشاء أمر العمل (مع إعادة المحاولة و branchSeqNum)
    const workOrder = await createWorkOrderWithRetry(workOrderData);

    // ربط الأصول المتعددة (إذا وجدت)
    if (assetIds && assetIds.length > 0) {
      await prisma.workOrderAsset.createMany({
        data: assetIds.map((assetId: string) => ({
          workOrderId: workOrder.id,
          assetId,
        })),
        skipDuplicates: true,
      });
    }

    // إعادة الأمر مع تضمين الأصول
    const result = await prisma.workOrder.findUnique({
      where: { id: workOrder.id },
      include: { workOrderAssets: { include: { asset: true } } },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/work-orders error:", error);
    return NextResponse.json(
      { error: error.message || "فشل إنشاء أمر العمل" },
      { status: 500 }
    );
  }
}