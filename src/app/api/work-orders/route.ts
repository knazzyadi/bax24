// src/app/api/work-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

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

    // شرط التصفية الأساسي
    const where: any = {
      companyId,
      deletedAt: null,
    };

    // نظام الفروع
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
      // البحث عن أوامر عمل تحتوي على أصل معين عبر WorkOrderAsset
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

    // ✅ إضافة نوع صريح للمعامل wo
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

    // توليد كود فريد
    const lastOrder = await prisma.workOrder.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });
    let nextNumber = 1;
    if (lastOrder?.code) {
      const match = lastOrder.code.match(/\d+$/);
      if (match) nextNumber = parseInt(match[0]) + 1;
    }
    const code = `WO-${nextNumber.toString().padStart(4, "0")}`;

    // ========== التحقق من صحة priorityId و statusId ==========
    let validPriorityId = null;
    if (priorityId && priorityId !== "" && priorityId !== "null" && priorityId !== "undefined" && priorityId !== "all") {
      const priorityExists = await prisma.workOrderPriority.findFirst({
        where: { id: priorityId, companyId },
        select: { id: true },
      });
      if (priorityExists) validPriorityId = priorityId;
    }

    let validStatusId = null;
    if (statusId && statusId !== "" && statusId !== "null" && statusId !== "undefined" && statusId !== "all") {
      const statusExists = await prisma.workOrderStatus.findFirst({
        where: { id: statusId, companyId },
        select: { id: true },
      });
      if (statusExists) validStatusId = statusId;
    }

    const workOrderData: any = {
      code,
      title,
      description,
      type: type || "MAINTENANCE",
      priorityId: validPriorityId,
      statusId: validStatusId,
      roomId: roomId || null,
      branchId: branchId || null,
      assetTypeId: assetTypeId || null,
      notes: notes || null,
      companyId,
      createdBy: session.user.id,
    };

    // إنشاء أمر العمل مع ربط الأصول
    const workOrder = await prisma.workOrder.create({
      data: {
        ...workOrderData,
        workOrderAssets: assetIds && assetIds.length
          ? { create: assetIds.map((assetId: string) => ({ assetId })) }
          : undefined,
      },
      include: { workOrderAssets: { include: { asset: true } } },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error("POST /api/work-orders error:", error);
    return NextResponse.json({ error: "فشل إنشاء أمر العمل" }, { status: 500 });
  }
}