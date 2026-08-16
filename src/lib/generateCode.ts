// src/lib/generateCode.ts

import { prisma } from "@/lib/prisma";
import { $Enums, Prisma } from "@prisma/client";

type WorkOrderTypeEnum = $Enums.WorkOrderTypeEnum;
type LocationLevel = $Enums.LocationLevel;

// ============================================================
// نوع Transaction Client
// ============================================================
type PrismaTx = Prisma.TransactionClient;

// ============================================================
// توليد كود أمر العمل داخل Transaction
// ============================================================
export async function generateWorkOrderCode(
  branchId: string,
  tx: PrismaTx = prisma
): Promise<{ code: string; branchSeqNum: number }> {
  const counter = await tx.workOrderCounter.upsert({
    where: { branchId },
    update: {
      lastValue: {
        increment: 1,
      },
    },
    create: {
      branchId,
      lastValue: 1,
    },
  });

  const branch = await tx.branch.findUnique({
    where: { id: branchId },
    select: {
      code: true,
    },
  });

  const prefix = branch?.code || "BR";

  const padded = counter.lastValue
    .toString()
    .padStart(4, "0");

  const code = `${prefix}-WO-${padded}`;

  return {
    code,
    branchSeqNum: counter.lastValue,
  };
}

// ============================================================
// إنشاء أمر عمل مع إعادة المحاولة
// ============================================================
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
    "MAINTENANCE",
    "CORRECTIVE",
    "EMERGENCY",
    "BULK_PREVENTIVE",
  ];

  const normalizeLocationLevel = (
    value: string | null | undefined
  ): LocationLevel | undefined => {
    if (
      value === "building" ||
      value === "floor" ||
      value === "room"
    ) {
      return value as LocationLevel;
    }

    return undefined;
  };

  for (
    let attempt = 1;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // توليد الكود داخل نفس Transaction
        const { code, branchSeqNum } =
          await generateWorkOrderCode(data.branchId, tx);

        const { assetId, ...workOrderData } = data;

        if (
          !validTypes.includes(
            workOrderData.type as WorkOrderTypeEnum
          )
        ) {
          throw new Error(
            `Invalid work order type: ${workOrderData.type}. ` +
              `Allowed types: ${validTypes.join(", ")}`
          );
        }

        const workOrderType =
          workOrderData.type as WorkOrderTypeEnum;

        const locationLevel =
          normalizeLocationLevel(
            workOrderData.locationLevel
          );

        const workOrder =
          await tx.workOrder.create({
            data: {
              ...workOrderData,

              code,
              branchSeqNum,

              type: workOrderType,

              buildingId:
                workOrderData.buildingId ?? undefined,

              floorId:
                workOrderData.floorId ?? undefined,

              roomId:
                workOrderData.roomId ?? undefined,

              locationLevel,

              ticketId:
                workOrderData.ticketId ?? undefined,

              assetTypeId:
                workOrderData.assetTypeId ?? undefined,

              source:
                workOrderData.source ?? undefined,

              sourceId:
                workOrderData.sourceId ?? undefined,

              sourceType:
                workOrderData.sourceType ?? undefined,

              notes:
                workOrderData.notes ?? undefined,

              reason:
                workOrderData.reason ?? undefined,

              description:
                workOrderData.description ?? undefined,
            },
          });

        if (assetId) {
          await tx.workOrderAsset.create({
            data: {
              workOrderId: workOrder.id,
              assetId,
            },
          });
        }

        return workOrder;
      });

      return result;
    } catch (error: unknown) {
      const isPrismaError =
        typeof error === "object" &&
        error !== null &&
        "code" in error;

      if (
        isPrismaError &&
        (error as { code: string }).code ===
          "P2002" &&
        attempt < maxRetries
      ) {
        console.log(
          `⚠️ Duplicate work order code, retrying ` +
            `(attempt ${attempt + 1})...`
        );

        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "فشل إنشاء أمر العمل بعد عدة محاولات"
  );
}