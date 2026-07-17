// src/lib/generateCode.ts
import { prisma } from "@/lib/prisma";
import { Prisma, $Enums } from "@prisma/client";

// ✅ استخدم الـ Enum الصحيح
type WorkOrderTypeEnum = $Enums.WorkOrderTypeEnum;

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

// ========== إنشاء أمر عمل مع إعادة المحاولة (مع دعم ربط الأصول) ==========
export async function createWorkOrderWithRetry(
  data: {
    title: string;
    description?: string;
    type: string;
    priorityId: string;
    statusId: string;
    roomId?: string | null;
    branchId: string;
    companyId: string;
    createdBy: string;
    ticketId?: string | null;
    assetTypeId?: string | null;
    notes?: string | null;
    assetId?: string | null;
  },
  maxRetries = 3
) {
  // ✅ قائمة القيم المسموح بها من الـ Enum
  const validTypes: WorkOrderTypeEnum[] = [
    'MAINTENANCE',
    'CORRECTIVE',
    'EMERGENCY',
    'BULK_PREVENTIVE'
  ];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { code, branchSeqNum } = await generateWorkOrderCode(data.branchId);
      
      const { assetId, ...workOrderData } = data;

      // ✅ التحقق من صحة النوع
      if (!validTypes.includes(workOrderData.type as WorkOrderTypeEnum)) {
        throw new Error(
          `Invalid work order type: ${workOrderData.type}. ` +
          `Allowed types: ${validTypes.join(', ')}`
        );
      }

      const workOrderType = workOrderData.type as WorkOrderTypeEnum;

      const workOrder = await prisma.workOrder.create({
        data: {
          ...workOrderData,
          code,
          branchSeqNum,
          type: workOrderType, // ✅ الآن النوع صحيح
          roomId: workOrderData.roomId ?? undefined,
          ticketId: workOrderData.ticketId ?? undefined,
          assetTypeId: workOrderData.assetTypeId ?? undefined,
          notes: workOrderData.notes ?? undefined,
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