// src/app/api/work-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { createWorkOrderWithRetry } from "@/lib/generateCode";
import { $Enums } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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

// ========== POST: إنشاء أمر عمل جديد (يدعم أصول متعددة ورفع ملفات) ==========
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

    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string || null;
    const type = formData.get('type') as string;
    const priorityId = formData.get('priorityId') as string;
    const statusId = formData.get('statusId') as string || null;
    const branchId = formData.get('branchId') as string;
    const assetTypeId = formData.get('assetTypeId') as string || null;
    const notes = formData.get('notes') as string || null;
    const source = formData.get('source') as string || 'manual';
    const category = formData.get('category') as string || null;
    const reason = formData.get('reason') as string || null;
    const sourceId = formData.get('sourceId') as string || null;
    const roomId = formData.get('roomId') as string || null;
    const floorId = formData.get('floorId') as string || null;
    const buildingId = formData.get('buildingId') as string || null;

    if (!branchId) {
      return NextResponse.json(
        { error: "الفرع مطلوب" },
        { status: 400 }
      );
    }

    const assetIdsRaw = formData.get('assetIds') as string || '[]';
    let assetIds: string[] = [];
    try {
      const parsed = JSON.parse(assetIdsRaw);
      if (Array.isArray(parsed)) {
        assetIds = parsed;
      } else {
        console.warn('assetIds is not an array, using empty array');
      }
    } catch (error) {
      console.error('Failed to parse assetIds:', error);
      assetIds = [];
    }

    const attachments = formData.getAll('attachments') as File[];
    // يمكن حفظ الملفات هنا إذا أردت

    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
    if (!isAdmin && branchId) {
      const userBranchIds = session.branchIds || [];
      if (!userBranchIds.includes(branchId)) {
        return NextResponse.json({ error: "لا تملك صلاحية إنشاء أمر عمل في هذا الفرع" }, { status: 403 });
      }
    }

    // ✅ تعريف المتغيرات لتدعم null
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

    const workOrderData = {
      title,
      description: description ?? undefined,
      type: workOrderTypeEnum,
      priorityId: finalPriorityId, // ✅ الآن string | null، سيتعامل معها Prisma
      statusId: finalStatusId,
      roomId: roomId ?? undefined,
      branchId: branchId,
      assetTypeId: assetTypeId ?? undefined,
      notes: notes ?? undefined,
      companyId,
      createdBy: session.userId,
      ticketId: sourceId ?? undefined,
      reason,
    };

    const workOrder = await createWorkOrderWithRetry(workOrderData);

    if (assetIds.length > 0) {
      await prisma.workOrderAsset.createMany({
        data: assetIds.map((assetId: string) => ({
          workOrderId: workOrder.id,
          assetId,
        })),
        skipDuplicates: true,
      });
    }

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