import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. إضافة عمود branchId (نص، غير فارغ، قيمه افتراضية مؤقتة)
    await prisma.$executeRaw`
      ALTER TABLE "AssetCounter" ADD COLUMN IF NOT EXISTS "branchId" TEXT NOT NULL DEFAULT 'temp';
    `;

    // 2. إزالة المفتاح الأساسي القديم (typeId فقط)
    await prisma.$executeRaw`
      ALTER TABLE "AssetCounter" DROP CONSTRAINT IF EXISTS "AssetCounter_pkey";
    `;

    // 3. تعيين المفتاح الأساسي الجديد (typeId, branchId)
    await prisma.$executeRaw`
      ALTER TABLE "AssetCounter" ADD PRIMARY KEY ("typeId", "branchId");
    `;

    // 4. حذف الصفوف التي لها branchId = 'temp' (اختياري)
    await prisma.$executeRaw`
      DELETE FROM "AssetCounter" WHERE "branchId" = 'temp';
    `;

    // 5. إعادة تعيين lastValue إلى 0 لكل الصفوف الحالية (اختياري)
    await prisma.$executeRaw`
      UPDATE "AssetCounter" SET "lastValue" = 0;
    `;

    return NextResponse.json({ message: 'AssetCounter table updated successfully' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}