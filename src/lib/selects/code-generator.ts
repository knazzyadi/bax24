// src/lib/selects/code-generator.ts
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * نوع الكائن الذي يقبل PrismaClient أو TransactionClient
 */
type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * توليد كود فريد للأصل باستخدام عداد (AssetCounter) لضمان عدم التكرار.
 *
 * @param db - كائن قاعدة البيانات (إما PrismaClient أو TransactionClient).
 * @param branchId - معرف الفرع.
 * @param typeId - معرف نوع الأصل.
 * @returns الكود النهائي على الصيغة: {branchCode}-{typeCode}-{sequence}
 */
export async function generateUniqueAssetCode(
  db: DbClient,
  branchId: string,
  typeId: string
): Promise<string> {
  // 1. جلب رمز النوع
  const assetType = await db.assetType.findUnique({
    where: { id: typeId },
    select: { code: true },
  });
  if (!assetType?.code) {
    throw new Error('نوع الأصل غير موجود أو لا يحتوي على رمز');
  }

  // 2. جلب رمز الفرع
  const branch = await db.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });
  if (!branch?.code) {
    throw new Error('الفرع غير موجود أو لا يحتوي على رمز');
  }

  // 3. تحديث العداد (upsert) - يعمل داخل أو خارج المعاملة
  const counter = await db.assetCounter.upsert({
    where: {
      typeId_branchId: { typeId, branchId },
    },
    update: {
      lastValue: { increment: 1 },
    },
    create: {
      typeId,
      branchId,
      lastValue: 1,
    },
  });

  // 4. توليد الكود النهائي (4 أرقام)
  const sequencePart = String(counter.lastValue).padStart(4, '0');
  return `${branch.code}-${assetType.code}-${sequencePart}`;
}