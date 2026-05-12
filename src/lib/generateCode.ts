// src/lib/generateCode.ts
import { prisma } from "@/lib/prisma";

export async function generateWorkOrderCode(branchId: string): Promise<string> {
  // 1. جلب آخر رقم تسلسلي لأمر عمل في نفس الفرع
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

  // 2. جلب اختصار الفرع (code) من جدول Branch
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });
  const branchPrefix = branch?.code || "BR"; // احتياطي: "BR" إذا لم يوجد code

  // 3. إعادة الكود بالصيغة المطلوبة
  return `${branchPrefix}-WO-${nextNumber.toString().padStart(4, "0")}`;
}