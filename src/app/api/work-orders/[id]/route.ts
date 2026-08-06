// src/app/api/work-orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { $Enums } from "@prisma/client";

type ErrorWithMessage = {
  message: string;
};

// ========== GET: جلب بيانات أمر العمل للتعديل ==========
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة" },
        { status: 400 }
      );
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        priority: true,
        status: true,
        assetType: true,
        branch: true,
        building: true,
        floor: true,
        room: true,
        workOrderAssets: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "أمر العمل غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(workOrder);
  } catch (error: unknown) {
    console.error("GET /api/work-orders/[id] error:", error);

    return NextResponse.json(
      { error: "خطأ في جلب بيانات أمر العمل" },
      { status: 500 }
    );
  }
}

// ========== PUT: تحديث أمر العمل ==========
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة" },
        { status: 400 }
      );
    }

    // ✅ 1. جلب السجل الحالي أولاً
    const existing = await prisma.workOrder.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "أمر العمل غير موجود" },
        { status: 404 }
      );
    }

    const body = await request.json();

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

    // ✅ 2. استخدام القيم الافتراضية من السجل الحالي إذا لم تُقدم
    const finalTitle = title ?? existing.title;
    const finalBranchId = branchId ?? existing.branchId;

    // التحقق من الصلاحيات باستخدام finalBranchId
    const isAdmin =
      session.role === "ADMIN" || session.role === "SUPER_ADMIN";

    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];

      if (!userBranchIds.includes(finalBranchId)) {
        return NextResponse.json(
          { error: "لا تملك صلاحية تعديل أمر العمل في هذا الفرع" },
          { status: 403 }
        );
      }
    }

    // باقي المعالجة (التحقق من الأولوية والحالة، إلخ)
    let finalPriorityId: string | null = priorityId;
    let finalStatusId: string | null = statusId;

    if (!finalPriorityId || finalPriorityId === "all") {
      const defaultPriority = await prisma.workOrderPriority.findFirst({
        where: {
          companyId,
          isDefault: true,
        },
      });

      if (defaultPriority) {
        finalPriorityId = defaultPriority.id;
      }
    } else {
      const exists = await prisma.workOrderPriority.findFirst({
        where: {
          id: finalPriorityId,
          companyId,
        },
      });

      if (!exists) {
        finalPriorityId = null;
      }
    }

    if (!finalStatusId || finalStatusId === "all") {
      const defaultStatus = await prisma.workOrderStatus.findFirst({
        where: {
          companyId,
          isDefault: true,
        },
      });

      if (defaultStatus) {
        finalStatusId = defaultStatus.id;
      }
    } else {
      const exists = await prisma.workOrderStatus.findFirst({
        where: {
          id: finalStatusId,
          companyId,
        },
      });

      if (!exists) {
        finalStatusId = null;
      }
    }

    if (!finalPriorityId || !finalStatusId) {
      return NextResponse.json(
        { error: "لا توجد حالة أو أولوية افتراضية محددة" },
        { status: 400 }
      );
    }

    let workOrderTypeEnum: $Enums.WorkOrderTypeEnum;

    try {
      workOrderTypeEnum = type as $Enums.WorkOrderTypeEnum;

      const validTypes: $Enums.WorkOrderTypeEnum[] = [
        "MAINTENANCE",
        "CORRECTIVE",
        "EMERGENCY",
        "BULK_PREVENTIVE",
      ];

      if (!validTypes.includes(workOrderTypeEnum)) {
        throw new Error("Invalid work order type");
      }
    } catch {
      workOrderTypeEnum = "MAINTENANCE";
    }

    const finalBuildingId = buildingId || null;

    let finalFloorId = floorId || null;
    let finalRoomId = roomId || null;

    if (locationLevel === "building") {
      finalFloorId = null;
      finalRoomId = null;
    } else if (locationLevel === "floor") {
      finalRoomId = null;
    }

    // ✅ 3. تحديث السجل باستخدام finalTitle و finalBranchId
    await prisma.workOrder.update({
      where: { id },
      data: {
        title: finalTitle.trim(),
        description: description || undefined,
        type: workOrderTypeEnum,
        priorityId: finalPriorityId,
        statusId: finalStatusId,
        branchId: finalBranchId,
        buildingId: finalBuildingId || undefined,
        floorId: finalFloorId || undefined,
        roomId: finalRoomId || undefined,
        locationLevel: locationLevel || undefined,
        assetTypeId: assetTypeId || undefined,
        notes: notes || undefined,
        sourceId: sourceId || undefined,
        sourceType: source || "manual",
        ticketId: ticketId || undefined,
        reason: reason || undefined,
        updatedAt: new Date(),
      },
    });

    // حذف الأصول القديمة وإضافة الجديدة
    await prisma.workOrderAsset.deleteMany({
      where: {
        workOrderId: id,
      },
    });

    if (
      Array.isArray(assetIds) &&
      assetIds.length > 0
    ) {
      await prisma.workOrderAsset.createMany({
        data: assetIds.map((assetId: string) => ({
          workOrderId: id,
          assetId,
        })),
        skipDuplicates: true,
      });
    }

    const result = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        priority: true,
        status: true,
        assetType: true,
        branch: true,
        building: true,
        floor: true,
        room: true,
        workOrderAssets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("PUT /api/work-orders/[id] error:", error);

    const message =
      error instanceof Error
        ? error.message
        : (error as ErrorWithMessage)?.message || "فشل تحديث أمر العمل";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}