// src/lib/generateCode.ts
import { prisma } from "@/lib/prisma";

/**
 * توليد كود تسلسلي لأمر العمل لكل فرع على حدة (مشابه لنظام التذاكر)
 * @param branchId معرف الفرع
 * @returns كود فريد (مثل "BR-WO-0001") ورقم تسلسلي داخل الفرع
 */
export async function generateWorkOrderCode(
  branchId: string
): Promise<{ code: string; branchSeqNum: number }> {
  // الحصول على آخر رقم تسلسلي مستخدم في هذا الفرع
  const lastWorkOrder = await prisma.workOrder.findFirst({
    where: { branchId, deletedAt: null },
    orderBy: { branchSeqNum: "desc" },
    select: { branchSeqNum: true },
  });

  const nextNumber = (lastWorkOrder?.branchSeqNum ?? 0) + 1;

  // الحصول على بادئة الفرع
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });
  const prefix = branch?.code || "BR";

  const code = `${prefix}-WO-${nextNumber.toString().padStart(4, "0")}`;

  return { code, branchSeqNum: nextNumber };
}

/**
 * إنشاء أمر عمل مع إعادة المحاولة لتجنب تضارب الأكواد (بسبب القيد الفريد المركب)
 * @param data بيانات أمر العمل (بدون code و branchSeqNum)
 * @param maxRetries عدد محاولات إعادة المحاولة
 * @returns أمر العمل المنشأ
 */
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
        console.log(
          `⚠️ Duplicate work order code, retrying (attempt ${attempt + 1})...`
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error("فشل إنشاء أمر العمل بعد عدة محاولات");
}