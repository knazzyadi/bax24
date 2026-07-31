// src/app/api/work-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { createWorkOrderWithRetry } from "@/lib/generateCode";
import { $Enums } from '@prisma/client';

// ========== GET: جلب أوامر العمل مع دعم الفلترة والفروع ==========
export async function GET(request: NextRequest) {
  try {
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const statusId = searchParams.get("statusId");
    const priorityId = searchParams.get("priorityId");
    const assetId = searchParams.get("assetId");
    const q = searchParams.get("q") || "";

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
    const branchIds = session.branchIds || [];

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
          building: true,
          floor: true,
          room: true,
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
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    const body = await request.json();

    // ============================================================
    // ✅ استخراج جميع الحقول من body (بما فيها الموقع)
    // ============================================================
    const {
      title,
      description,
      type,
      priorityId,
      statusId,
      branchId,
      buildingId,
      floorId,
      roomId,
      locationLevel,
      assetTypeId,
      assetIds,
      notes,
      source,
      sourceId,
      reason,
      ticketId,
    } = body;

    // التحقق من وجود العنوان والفرع
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "عنوان أمر العمل مطلوب" },
        { status: 400 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { error: "الفرع مطلوب" },
        { status: 400 }
      );
    }

    // ============================================================
    // ✅ التحقق من صلاحيات المستخدم على الفرع
    // ============================================================
    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      if (!userBranchIds.includes(branchId)) {
        return NextResponse.json(
          { error: "لا تملك صلاحية إنشاء أمر عمل في هذا الفرع" },
          { status: 403 }
        );
      }
    }

    // ============================================================
    // ✅ تحديد الأولوية والحالة الافتراضية
    // ============================================================
    let finalPriorityId: string | null = priorityId;
    let finalStatusId: string | null = statusId;

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

    // ============================================================
    // ✅ تحديد نوع أمر العمل
    // ============================================================
    let workOrderTypeEnum: $Enums.WorkOrderTypeEnum;
    try {
      workOrderTypeEnum = type as $Enums.WorkOrderTypeEnum;
      const validTypes = ['MAINTENANCE', 'CORRECTIVE', 'EMERGENCY', 'BULK_PREVENTIVE'];
      if (!validTypes.includes(workOrderTypeEnum)) {
        throw new Error('Invalid work order type');
      }
    } catch {
      workOrderTypeEnum = 'MAINTENANCE';
    }

    // ============================================================
    // ✅ تنظيف قيم الموقع حسب المستوى المختار
    // ============================================================
    const finalBuildingId = buildingId || null;
    let finalFloorId = floorId || null;
    let finalRoomId = roomId || null;

    // إذا كان المستوى مبنى → نلغي الدور والغرفة
    if (locationLevel === "building") {
      finalFloorId = null;
      finalRoomId = null;
    }

    // إذا كان المستوى دور → نلغي الغرفة فقط
    if (locationLevel === "floor") {
      finalRoomId = null;
    }

    // إذا كان المستوى غرفة → نبقي كل القيم كما هي

    // ============================================================
    // ✅ 1. إنشاء أمر العمل مع حفظ الموقع النظيف
    // ============================================================
    const workOrder = await createWorkOrderWithRetry({
    title: title.trim(),
    description: description || undefined,

    type: workOrderTypeEnum,

    priorityId: finalPriorityId,
    statusId: finalStatusId,

    companyId,
    createdBy: session.userId,

    // الموقع
    branchId: branchId || undefined,
    buildingId: finalBuildingId || undefined,
    floorId: finalFloorId || undefined,
    roomId: finalRoomId || undefined,
    locationLevel: locationLevel || undefined,

    // حقول إضافية
    assetTypeId: assetTypeId || undefined,
    notes: notes || undefined,

    // ✅ مصدر أمر العمل
    source: source || "manual",

    // ✅ الربط بالمصدر
    sourceId: sourceId || undefined,
    sourceType: source || "MANUAL",

    ticketId: ticketId || undefined,

    reason: reason || undefined,
  });

    // ============================================================
    // ✅ 2. ربط الأصول (إن وجدت) - بعد إنشاء أمر العمل مباشرة
    // ============================================================
    if (assetIds && Array.isArray(assetIds) && assetIds.length > 0) {
      await prisma.workOrderAsset.createMany({
        data: assetIds.map((assetId: string) => ({
          workOrderId: workOrder.id,
          assetId,
        })),
        skipDuplicates: true,
      });
    }

    // ============================================================
    // ✅ 3. جلب أمر العمل المكتمل مع جميع العلاقات
    // ============================================================
    const result = await prisma.workOrder.findUnique({
      where: { id: workOrder.id },
      include: {
        priority: true,
        status: true,
        assetType: true,
        branch: true,
        building: true,
        floor: true,
        room: true,
        workOrderAssets: {
          include: { asset: true },
        },
      },
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