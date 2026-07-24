// scripts/export-company-config.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ✅ محاكاة __dirname في ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function exportCompanyConfig(companyId: string) {
  console.log(`📤 Exporting configuration for company: ${companyId}`);

  const config = {
    // ✅ تم حذف nameAr (غير موجود في Prisma Models)
    assetTypes: await prisma.assetType.findMany({
      where: { companyId },
      select: { code: true, name: true, isActive: true, isDefault: true },
    }),
    assetStatuses: await prisma.assetStatus.findMany({
      where: { companyId },
      select: { code: true, name: true, color: true, isActive: true, isDefault: true }, // ✅ حذف nameAr
    }),
    workOrderTypes: await prisma.workOrderType.findMany({
      where: { companyId },
      select: { code: true, name: true, isActive: true, isDefault: true }, // ✅ حذف nameAr
    }),
    workOrderStatuses: await prisma.workOrderStatus.findMany({
      where: { companyId },
      select: { code: true, name: true, color: true, isActive: true, isDefault: true }, // ✅ حذف nameAr
    }),
    workOrderPriorities: await prisma.workOrderPriority.findMany({
      where: { companyId },
      select: { code: true, name: true, color: true, isActive: true, isDefault: true }, // ✅ حذف nameAr
    }),
    inspectionCategories: await prisma.inspectionCategory.findMany({
      where: { companyId, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          select: {
            code: true,
            name: true,
            // ✅ nameAr موجود في InspectionItem (يختلف عن النماذج الأخرى)
            nameAr: true,
            description: true,
            cbahiCode: true,
            riskLevel: true,
            inputType: true,
            sortOrder: true,
            isActive: true,
            autoCreateWorkOrder: true,
          },
        },
      },
    }),
    // ✅ يمكنك إضافة جداول أخرى هنا
  };

  const outputPath = path.join(__dirname, `config-${companyId}-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
  console.log(`✅ Config exported to: ${outputPath}`);
  return outputPath;
}

// تشغيل السكربت
const companyId = process.argv[2];
if (!companyId) {
  console.error('❌ Usage: npx ts-node scripts/export-company-config.ts <companyId>');
  process.exit(1);
}

exportCompanyConfig(companyId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });