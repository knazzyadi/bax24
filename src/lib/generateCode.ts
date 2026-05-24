import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";  // ✅ أضف هذا الاستيراد

export async function generateWorkOrderCode(
  branchId: string
): Promise<{ code: string; branchSeqNum: number }> {
  // استخدام المعاملة (transaction) مع تحديد النوع
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

export async function createWorkOrderWithRetry(
  data: any,
  maxRetries = 3
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { code, branchSeqNum } = await generateWorkOrderCode(data.branchId);
      const workOrder = await prisma.workOrder.create({
        data: {
          ...data,
          code,
          branchSeqNum,
        },
      });
      return workOrder;
    } catch (error: any) {
      if (error.code === "P2002" && attempt < maxRetries) {
        console.log(`⚠️ Duplicate work order code, retrying (attempt ${attempt + 1})...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("فشل إنشاء أمر العمل بعد عدة محاولات");
}