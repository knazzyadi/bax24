// scripts/import-company-config.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================
// دوال مساعدة للتحقق من وجود الأقسام والنماذج
// ============================================================

async function getOrCreateDefaultSection(companyId: string) {
  // البحث عن قسم موجود (أو إنشاء قسم افتراضي)
  let section = await prisma.inspectionSection.findFirst({
    where: {
      companyId,
      deletedAt: null,
    },
  });

  if (!section) {
    section = await prisma.inspectionSection.create({
      data: {
        companyId,
        code: 'DEFAULT',
        name: 'Default Section',
        nameAr: 'القسم الافتراضي',
        isActive: true,
      },
    });
    console.log('  ✅ Created default section:', section.code);
  }

  return section;
}

async function getOrCreateDefaultTemplate(companyId: string, sectionId: string) {
  // البحث عن قالب موجود (أو إنشاء قالب افتراضي)
  let template = await prisma.inspectionTemplate.findFirst({
    where: {
      companyId,
      sectionId,
      deletedAt: null,
    },
  });

  if (!template) {
    template = await prisma.inspectionTemplate.create({
      data: {
        companyId,
        sectionId,
        code: 'DEFAULT',
        name: 'Default Template',
        nameAr: 'النموذج الافتراضي',
        isActive: true,
      },
    });
    console.log('  ✅ Created default template:', template.code);
  }

  return template;
}

async function importCompanyConfig(companyId: string, filePath: string) {
  console.log(`📥 Importing config to company: ${companyId}`);

  const jsonData = fs.readFileSync(filePath, 'utf-8');
  const config = JSON.parse(jsonData);

  // 1️⃣ التأكد من وجود قسم ونموذج للفئات
  const section = await getOrCreateDefaultSection(companyId);
  const template = await getOrCreateDefaultTemplate(companyId, section.id);

  // 2️⃣ أنواع الأصول
  console.log('  📦 Seeding Asset Types...');
  for (const type of config.assetTypes || []) {
    await prisma.assetType.upsert({
      where: { companyId_code: { companyId, code: type.code } },
      update: {},
      create: { ...type, companyId },
    });
  }

  // 3️⃣ حالات الأصول
  console.log('  📦 Seeding Asset Statuses...');
  for (const status of config.assetStatuses || []) {
    await prisma.assetStatus.upsert({
      where: { companyId_code: { companyId, code: status.code } },
      update: {},
      create: { ...status, companyId },
    });
  }

  // 4️⃣ أنواع أوامر العمل
  console.log('  📦 Seeding Work Order Types...');
  for (const type of config.workOrderTypes || []) {
    await prisma.workOrderType.upsert({
      where: { companyId_code: { companyId, code: type.code } },
      update: {},
      create: { ...type, companyId },
    });
  }

  // 5️⃣ حالات أوامر العمل
  console.log('  📦 Seeding Work Order Statuses...');
  for (const status of config.workOrderStatuses || []) {
    await prisma.workOrderStatus.upsert({
      where: { companyId_code: { companyId, code: status.code } },
      update: {},
      create: { ...status, companyId },
    });
  }

  // 6️⃣ أولويات أوامر العمل
  console.log('  📦 Seeding Work Order Priorities...');
  for (const priority of config.workOrderPriorities || []) {
    await prisma.workOrderPriority.upsert({
      where: { companyId_code: { companyId, code: priority.code } },
      update: {},
      create: { ...priority, companyId },
    });
  }

  // 7️⃣ فئات الفحص والبنود (مع ربطها بالقالب الافتراضي)
  console.log('  📦 Seeding Inspection Categories & Items...');
  for (const category of config.inspectionCategories || []) {
    // ✅ استخدام templateId الخاص بالقالب الافتراضي
    const createdCategory = await prisma.inspectionCategory.upsert({
      where: {
        companyId_code: { companyId, code: category.code },
      },
      update: {
        templateId: template.id, // ✅ تحديث templateId
      },
      create: {
        companyId,
        templateId: template.id, // ✅ إضافة templateId
        code: category.code,
        name: category.name,
        nameAr: category.nameAr,
        description: category.description,
        isActive: category.isActive,
      },
    });

    // إنشاء البنود المرتبطة
    for (const item of category.items || []) {
      await prisma.inspectionItem.upsert({
        where: {
          companyId_code: { companyId, code: item.code },
        },
        update: {},
        create: {
          companyId,
          categoryId: createdCategory.id,
          code: item.code,
          name: item.name,
          nameAr: item.nameAr,
          description: item.description,
          cbahiCode: item.cbahiCode,
          riskLevel: item.riskLevel,
          inputType: item.inputType,
          sortOrder: item.sortOrder || 0,
          isActive: item.isActive,
          autoCreateWorkOrder: item.autoCreateWorkOrder || false,
        },
      });
    }
  }

  console.log(`✅ Config imported successfully to company: ${companyId}`);
}

// تشغيل السكربت
const companyId = process.argv[2];
const filePath = process.argv[3];

if (!companyId || !filePath) {
  console.error('❌ Usage: npx ts-node scripts/import-company-config.ts <companyId> <jsonFilePath>');
  process.exit(1);
}

importCompanyConfig(companyId, path.resolve(filePath))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });