import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

// ========== GET: جلب أمر عمل واحد مع التفاصيل (وتضمين buildingId/floorId إذا وجدت) ==========
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("work_orders.read", session);

    const { id } = await params;
    const companyId = session.user.companyId;
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

    // فلترة الفروع للمستخدمين غير المديرين
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    if (!isAdmin) {
      const userBranchIds = session.user.branchIds || [];
      if (!workOrder.branchId || !userBranchIds.includes(workOrder.branchId)) {
        return NextResponse.json({ error: "غير مصرح بالوصول إلى هذا الأمر" }, { status: 403 });
      }
    }

    // إضافة حقل buildingId و floorId من العلاقة (لتسهيل عرضها في الواجهة)
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

// ========== PUT: تحديث أمر العمل (يدعم تحديث الموقع والأصول المتعددة) ==========
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    await requirePermission("work_orders.update", session);

    const { id } = await params;
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
      assetTypeId,
      notes,
      assetIds,
    } = body;

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    // التأكد من وجود أمر العمل
    const existing = await prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "أمر العمل غير موجود" }, { status: 404 });
    }

    // ========== معالجة القيم غير الصالحة للأولوية والحالة ==========
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
    // ============================================================

    // تجميع حقول التحديث الأساسية
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (priorityId !== undefined) updateData.priorityId = validPriorityId;
    if (statusId !== undefined) updateData.statusId = validStatusId;
    if (branchId !== undefined) updateData.branchId = branchId;
    if (assetTypeId !== undefined) updateData.assetTypeId = assetTypeId;
    if (notes !== undefined) updateData.notes = notes;

    // تحديث حقل roomId إذا وُجد (الأولوية للـ roomId)
    if (roomId !== undefined) {
      updateData.roomId = roomId;
      // إذا تم تعيين roomId، يجب إلغاء buildingId و floorId (لأن العلاقة عبر roomId)
      // لكن إذا كان النموذج لا يحتوي على buildingId/floorId، فلا داعي لإلغائهما.
    }
    // إذا لم يكن هناك roomId ولكن تم إرسال floorId أو buildingId، فيمكن تحديث fields إضافية (إذا كانت موجودة في النموذج)
    // لا يوجد حالياً buildingId و floorId في نموذج WorkOrder؛ نتركه للاستخدام المستقبلي.

    // تحديث الأصول المرتبطة (تحل محل الأصول القديمة)
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
      include: { workOrderAssets: { include: { asset: true } } },
    });

    return NextResponse.json(updatedWorkOrder);
  } catch (error) {
    console.error("PUT /api/work-orders/[id] error:", error);
    return NextResponse.json({ error: "فشل تحديث أمر العمل" }, { status: 500 });
  }
}

// ========== DELETE: حذف أمر العمل (soft delete) ==========
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    await requirePermission("work_orders.delete", session);

    const { id } = await params;
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    const existing = await prisma.workOrder.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "أمر العمل غير موجود" }, { status: 404 });
    }

    await prisma.workOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "تم حذف أمر العمل بنجاح" });
  } catch (error) {
    console.error("DELETE /api/work-orders/[id] error:", error);
    return NextResponse.json({ error: "فشل حذف أمر العمل" }, { status: 500 });
  }
}