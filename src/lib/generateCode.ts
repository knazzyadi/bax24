// src/lib/generateCode.ts
import { prisma } from "@/lib/prisma";
import type { Prisma, WorkOrderType } from "@prisma/client";

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
    assetId?: string | null; // ✅ إضافة معرف الأصل المراد ربطه
  },
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { code, branchSeqNum } = await generateWorkOrderCode(data.branchId);
      
      // إنشاء أمر العمل أولاً
      const workOrder = await prisma.workOrder.create({
        data: {
          ...data,
          code,
          branchSeqNum,
          type: data.type as WorkOrderType,
          roomId: data.roomId ?? undefined,
          ticketId: data.ticketId ?? undefined,
          assetTypeId: data.assetTypeId ?? undefined,
          notes: data.notes ?? undefined,
          description: data.description ?? undefined,
        },
      });

      // ✅ إذا تم تمرير assetId، نقوم بربط الأصل بأمر العمل
      if (data.assetId) {
        await prisma.workOrderAsset.create({
          data: {
            workOrderId: workOrder.id,
            assetId: data.assetId,
          },
        });
      }

      return workOrder;
    } catch (error: unknown) {
      const isPrismaError = typeof error === 'object' && error !== null && 'code' in error;
      if (isPrismaError && error.code === "P2002" && attempt < maxRetries) {
        console.log(`⚠️ Duplicate work order code, retrying (attempt ${attempt + 1})...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("فشل إنشاء أمر العمل بعد عدة محاولات");
}