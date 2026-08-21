// src/lib/selects/code-generator.ts

import { PrismaClient, Prisma } from "@prisma/client";

/**
 * نوع الكائن الذي يقبل PrismaClient أو TransactionClient
 */
type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * توليد كود فريد للأصل باستخدام AssetCounter.
 *
 * مهم:
 * - يمكن استخدام الدالة مع PrismaClient العادي.
 * - ويمكن استخدامها مع TransactionClient.
 * - عند تمرير tx من داخل $transaction فإن AssetCounter
 *   يتم تحديثه داخل نفس المعاملة.
 *
 * صيغة الكود:
 * {branchCode}-{typeCode}-{sequence}
 *
 * مثال:
 * RIY-DG-0001
 * RIY-DG-0002
 * RIY-AC-0001
 */
export async function generateUniqueAssetCode(
  db: DbClient,
  branchId: string,
  typeId: string,
  branchCode: string,
  typeCode: string
): Promise<string> {
  // ============================================================
  // التحقق من البيانات الأساسية
  // ============================================================

  if (!branchId) {
    throw new Error("معرف الفرع مطلوب");
  }

  if (!typeId) {
    throw new Error("معرف نوع الأصل مطلوب");
  }

  if (!branchCode?.trim()) {
    throw new Error("الفرع لا يحتوي على رمز");
  }

  if (!typeCode?.trim()) {
    throw new Error("نوع الأصل لا يحتوي على رمز");
  }

  // تنظيف الأكواد
  const cleanBranchCode = branchCode.trim();
  const cleanTypeCode = typeCode.trim();

  // ============================================================
  // تحديث / إنشاء عداد الأصل
  //
  // المفتاح:
  // typeId + branchId
  //
  // مثال:
  // branchId = branch-1
  // typeId   = type-5
  //
  // سيكون هناك عداد مستقل لهذا النوع داخل هذا الفرع.
  // ============================================================

  const counter = await db.assetCounter.upsert({
    where: {
      typeId_branchId: {
        typeId,
        branchId,
      },
    },

    update: {
      lastValue: {
        increment: 1,
      },
    },

    create: {
      typeId,
      branchId,
      lastValue: 1,
    },
  });

  // ============================================================
  // تحويل الرقم إلى 4 خانات
  //
  // 1    → 0001
  // 10   → 0010
  // 100  → 0100
  // 1000 → 1000
  // ============================================================

  const sequencePart = String(counter.lastValue).padStart(4, "0");

  // ============================================================
  // إنشاء الكود النهائي
  // ============================================================

  return `${cleanBranchCode}-${cleanTypeCode}-${sequencePart}`;
}