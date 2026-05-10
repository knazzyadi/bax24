// src/lib/generateCode.ts
import { prisma } from '@/lib/prisma';

/**
 * توليد كود فريد لأمر العمل
 * @param companyId - معرف الشركة
 * @param branchId - معرف الفرع (اختياري). إذا تم تمريره، سيتم الترقيم على مستوى الفرع.
 * @returns كود بالتنسيق WO-XXXX (مثال: WO-0001)
 */
export async function generateWorkOrderCode(companyId: string, branchId?: string): Promise<string> {
  // بناء شرط البحث حسب الشركة والفرع (إذا وُجد)
  const where: any = { companyId };
  if (branchId) {
    where.branchId = branchId;
  }

  // الحصول على آخر أمر عمل للفرع/الشركة حسب الكود تنازلياً
  const lastWorkOrder = await prisma.workOrder.findFirst({
    where,
    orderBy: { code: 'desc' },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastWorkOrder?.code) {
    const match = lastWorkOrder.code.match(/WO-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `WO-${nextNumber.toString().padStart(4, '0')}`;
}