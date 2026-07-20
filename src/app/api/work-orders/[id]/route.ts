// src/app/api/work-orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession, requirePermission } from '@/lib/auth/auth-helper'; // ✅ استبدال checkPermission بـ requirePermission
import { prisma } from '@/lib/prisma';
import { createWorkOrderAudit, buildWorkOrderDTO } from '@/lib/audit/work-order';
import { AuditAction } from '@/lib/audit/types';

// ========== GET: جلب أمر عمل واحد مع التفاصيل ==========
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("work_orders.read"); // ✅

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        priority: true,
        status: true,
        assetType: true,
        branch: true,
        room: {
          include: {
            floor: {
              include: { building: true },
            },
          },
        },
        workOrderAssets: {
          include: { asset: { include: { type: true, status: true } } },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "أمر العمل غير موجود" }, { status: 404 });
    }

    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      if (!workOrder.branchId || !userBranchIds.includes(workOrder.branchId)) {
        return NextResponse.json({ error: "غير مصرح بالوصول إلى هذا الأمر" }, { status: 403 });
      }
    }

    let buildingId: string | null = null;
    let floorId: string | null = null;
    if (workOrder.room?.floor) {
      floorId = workOrder.room.floor.id;
      buildingId = workOrder.room.floor.buildingId;
    }

    const serialized = {
      ...workOrder,
      createdAt: workOrder.createdAt.toISOString(),
      updatedAt: workOrder.updatedAt.toISOString(),
      buildingId,
      floorId,
      branchId: workOrder.branchId,
    };
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET /api/work-orders/[id] error:", error);
    return NextResponse.json({ error: "خطأ في جلب أمر العمل" }, { status: 500 });
  }
}

// ========== PUT: تحديث أمر العمل ==========
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    await requirePermission("work_orders.update"); // ✅

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      workOrderTypeId,
      priorityId,
      statusId,
      branchId,
      buildingId,
      floorId,
      roomId,
      assetTypeId,
      notes,
      assetIds,
    } = body;

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    // جلب النسخة القديمة
    const oldWorkOrder = await prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        priority: true,
        status: true,
        assetType: true,
        branch: true,
        room: {
          include: {
            floor: {
              include: { building: true },
            },
          },
        },
        workOrderAssets: {
          include: { asset: true },
        },
        workOrderType: true,
        assignedUser: true,
        createdByUser: true,
      },
    });

    if (!oldWorkOrder) {
      return NextResponse.json({ error: "أمر العمل غير موجود" }, { status: 404 });
    }

    // التحقق من صحة الأولوية والحالة
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

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (workOrderTypeId !== undefined) updateData.workOrderTypeId = workOrderTypeId;
    if (priorityId !== undefined) updateData.priorityId = validPriorityId;
    if (statusId !== undefined) updateData.statusId = validStatusId;
    if (branchId !== undefined) updateData.branchId = branchId;
    if (assetTypeId !== undefined) updateData.assetTypeId = assetTypeId;
    if (notes !== undefined) updateData.notes = notes;
    if (roomId !== undefined) updateData.roomId = roomId;

    let updateAssets = undefined;
    if (assetIds !== undefined) {
      updateAssets = {
        deleteMany: {},
        create: assetIds.map((assetId: string) => ({ assetId })),
      };
    }

    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        ...updateData,
        workOrderAssets: updateAssets,
      },
      include: {
        priority: true,
        status: true,
        assetType: true,
        branch: true,
        room: {
          include: {
            floor: {
              include: { building: true },
            },
          },
        },
        workOrderAssets: {
          include: { asset: { include: { type: true, status: true } } },
        },
        workOrderType: true,
        assignedUser: true,
        createdByUser: true,
      },
    });

    // ✅ تسجيل التدقيق - استخدام session.email
    await createWorkOrderAudit(
      AuditAction.UPDATE,
      id,
      session.userId,
      session.email,
      oldWorkOrder,
      updatedWorkOrder,
      { updatedFields: Object.keys(body) }
    );

    return NextResponse.json(updatedWorkOrder);
  } catch (error) {
    console.error("PUT /api/work-orders/[id] error:", error);
    return NextResponse.json({ error: "فشل تحديث أمر العمل" }, { status: 500 });
  }
}

// ========== DELETE: حذف أمر العمل ==========
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    await requirePermission("work_orders.delete"); // ✅

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    // جلب النسخة قبل الحذف
    const oldWorkOrder = await prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        priority: true,
        status: true,
        assetType: true,
        branch: true,
        room: {
          include: {
            floor: {
              include: { building: true },
            },
          },
        },
        workOrderAssets: {
          include: { asset: true },
        },
        workOrderType: true,
        assignedUser: true,
        createdByUser: true,
      },
    });

    if (!oldWorkOrder) {
      return NextResponse.json({ error: "أمر العمل غير موجود" }, { status: 404 });
    }

    await prisma.workOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // ✅ تسجيل التدقيق (حذف) - استخدام session.email
    await createWorkOrderAudit(
      AuditAction.DELETE,
      id,
      session.userId,
      session.email,
      oldWorkOrder,
      null,
      { softDelete: true }
    );

    return NextResponse.json({ message: "تم حذف أمر العمل بنجاح" });
  } catch (error) {
    console.error("DELETE /api/work-orders/[id] error:", error);
    return NextResponse.json({ error: "فشل حذف أمر العمل" }, { status: 500 });
  }
}