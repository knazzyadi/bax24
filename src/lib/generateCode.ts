// src/lib/generateCode.ts
import { prisma } from "@/lib/prisma";

export async function generateWorkOrderCode(branchId: string): Promise<string> {
  const lastWorkOrder = await prisma.workOrder.findFirst({
    where: { branchId, deletedAt: null },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastWorkOrder?.code) {
    const match = lastWorkOrder.code.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0], 10) + 1;
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });
  const prefix = branch?.code || "BR";
  return `${prefix}-WO-${nextNumber.toString().padStart(4, "0")}`;
}

// ✅ دالة جديدة لإنشاء أمر عمل مع إعادة المحاولة
export async function createWorkOrderWithRetry(
  data: any,
  maxRetries = 3
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const code = await generateWorkOrderCode(data.branchId);
      const workOrder = await prisma.workOrder.create({
        data: { ...data, code },
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