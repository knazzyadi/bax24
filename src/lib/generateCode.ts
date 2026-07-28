// src/lib/generateCode.ts
import { prisma } from "@/lib/prisma";
import { Prisma, $Enums } from "@prisma/client";

type WorkOrderTypeEnum = $Enums.WorkOrderTypeEnum;
type LocationLevel = $Enums.LocationLevel;

// ========== دالة توليد كود أمر العمل ==========
export async function generateWorkOrderCode(
  branchId: string
): Promise<{ code: string; branchSeqNum: number }> {
  const result = await prisma.$transaction(async (tx) => {
    const counter = await tx.workOrderCounter.upsert({
      where: { branchId },
      update: { lastValue: { increment: 1 } },
      create: { branchId, lastValue: 1 },
    });

    const branch = await tx.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });
    const prefix = branch?.code || "BR";
    const padded = counter.lastValue.toString().padStart(4, "0");
    const code = `${prefix}-WO-${padded}`;
    return { code, branchSeqNum: counter.lastValue };
  });

  return result;
}

// ========== إنشاء أمر عمل مع إعادة المحاولة (مع دعم جميع الحقول) ==========
export async function createWorkOrderWithRetry(
  data: {
    title: string;
    description?: string;
    type: string;
    priorityId: string;
    statusId: string;
    branchId: string;
    buildingId?: string | null;
    floorId?: string | null;
    roomId?: string | null;
    locationLevel?: string | null;
    companyId: string;
    createdBy: string;
    ticketId?: string | null;
    assetTypeId?: string | null;
    source?: $Enums.WorkOrderSource | null;
    sourceId?: string | null;
    sourceType?: string | null;
    notes?: string | null;
    reason?: string | null;
    assetId?: string | null;
  },
  maxRetries = 3
) {
  const validTypes: WorkOrderTypeEnum[] = [
    'MAINTENANCE',
    'CORRECTIVE',
    'EMERGENCY',
    'BULK_PREVENTIVE'
  ];

  // ✅ تحويل locationLevel إلى النوع الصحيح
  const normalizeLocationLevel = (value: string | null | undefined): LocationLevel | undefined => {
    if (value === 'building' || value === 'floor' || value === 'room') {
      return value as LocationLevel;
    }
    return undefined;
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { code, branchSeqNum } = await generateWorkOrderCode(data.branchId);
      
      const { assetId, ...workOrderData } = data;

      if (!validTypes.includes(workOrderData.type as WorkOrderTypeEnum)) {
        throw new Error(
          `Invalid work order type: ${workOrderData.type}. ` +
          `Allowed types: ${validTypes.join(', ')}`
        );
      }

      const workOrderType = workOrderData.type as WorkOrderTypeEnum;
      const locationLevel = normalizeLocationLevel(workOrderData.locationLevel);

      const workOrder = await prisma.workOrder.create({
        data: {
          ...workOrderData,
          code,
          branchSeqNum,
          type: workOrderType,
          buildingId: workOrderData.buildingId ?? undefined,
          floorId: workOrderData.floorId ?? undefined,
          roomId: workOrderData.roomId ?? undefined,
          locationLevel: locationLevel,
          ticketId: workOrderData.ticketId ?? undefined,
          assetTypeId: workOrderData.assetTypeId ?? undefined,
          source: workOrderData.source ?? undefined,
          sourceId: workOrderData.sourceId ?? undefined,
          sourceType: workOrderData.sourceType ?? undefined,
          notes: workOrderData.notes ?? undefined,
          reason: workOrderData.reason ?? undefined,
          description: workOrderData.description ?? undefined,
        },
      });

      if (assetId) {
        await prisma.workOrderAsset.create({
          data: {
            workOrderId: workOrder.id,
            assetId: assetId,
          },
        });
      }

      return workOrder;
    } catch (error: unknown) {
      const isPrismaError = typeof error === 'object' && error !== null && 'code' in error;
      if (isPrismaError && (error as any).code === "P2002" && attempt < maxRetries) {
        console.log(`⚠️ Duplicate work order code, retrying (attempt ${attempt + 1})...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("فشل إنشاء أمر العمل بعد عدة محاولات");
}