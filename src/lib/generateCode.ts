// src/lib/generateCode.ts
import { prisma } from "@/lib/prisma";

/**
 * توليد كود تسلسلي لأمر العمل (Work Order)
 * @param companyId معرف الشركة
 * @returns كود فريد مثل WO-0001, WO-0002
 */
export async function generateWorkOrderCode(companyId: string): Promise<string> {
  // الحصول على آخر أمر عمل في نفس الشركة (حسب الكود تنازلياً)
  const lastWorkOrder = await prisma.workOrder.findFirst({
    where: { companyId, deletedAt: null },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastWorkOrder?.code) {
    const match = lastWorkOrder.code.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0], 10) + 1;
  }

  return `WO-${nextNumber.toString().padStart(4, "0")}`;
}