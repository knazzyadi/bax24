// scripts/seed-company.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  defaultWorkOrderTypes,
  defaultWorkOrderPriorities,
  defaultWorkOrderStatuses,
  defaultWorkOrderCloseReasons,
  defaultWorkOrderCancelReasons,
  defaultAssetTypes,
  defaultAssetStatuses,
  defaultInspectionSections,
  defaultInspectionTemplates,
  defaultInspectionCategories,
  defaultInspectionItems,
} from '../src/lib/defaults';

// ============================================================
// دالة عامة للجداول البسيطة (Create-Only) - بدون قيود على T
// ============================================================
async function seedSimpleTable<T>(
  model: any, // يمكن استبدالها بـ Prisma.Delegate إذا أردت تحسين النوع
  companyId: string,
  data: T[]
): Promise<void> {
  if (data.length === 0) return;

  await model.createMany({
    data: data.map((item) => ({
      companyId,
      ...item,
    })),
    skipDuplicates: true,
  });
}

// ============================================================
// الدالة الأساسية - باستخدام Transaction و Create-Only
// ============================================================
async function seedCompany(companyId: string): Promise<void> {
  console.log(`🌱 Start seeding company: ${companyId}`);

  await prisma.$transaction(async (tx) => {
    // =====================================================
    // Work Order Types
    // =====================================================
    await seedSimpleTable(tx.workOrderType, companyId, defaultWorkOrderTypes);

    // =====================================================
    // Work Order Priorities
    // =====================================================
    await seedSimpleTable(tx.workOrderPriority, companyId, defaultWorkOrderPriorities);

    // =====================================================
    // Work Order Statuses
    // =====================================================
    await seedSimpleTable(tx.workOrderStatus, companyId, defaultWorkOrderStatuses);

    // =====================================================
    // Work Order Close Reasons
    // =====================================================
    await seedSimpleTable(tx.workOrderCloseReason, companyId, defaultWorkOrderCloseReasons);

    // =====================================================
    // Work Order Cancel Reasons
    // =====================================================
    await seedSimpleTable(tx.workOrderCancelReason, companyId, defaultWorkOrderCancelReasons);

    // =====================================================
    // Asset Types
    // =====================================================
    await seedSimpleTable(tx.assetType, companyId, defaultAssetTypes);

    // =====================================================
    // Asset Statuses
    // =====================================================
    await seedSimpleTable(tx.assetStatus, companyId, defaultAssetStatuses);

    // =====================================================
    // Inspection Sections (تعتمد على التسلسل الهرمي)
    // =====================================================
    const sectionMap = new Map<string, string>();
    for (const item of defaultInspectionSections) {
      const result = await tx.inspectionSection.upsert({
        where: { companyId_code: { companyId, code: item.code } },
        update: {},
        create: {
          companyId,
          ...item,
        },
      });
      sectionMap.set(item.code, result.id);
    }

    // =====================================================
    // Inspection Templates
    // =====================================================
    const templateMap = new Map<string, string>();
    for (const item of defaultInspectionTemplates) {
      const sectionId = sectionMap.get(item.sectionCode);
      if (!sectionId) {
        throw new Error(
          `❌ Section "${item.sectionCode}" not found for template "${item.code}". ` +
          `Check defaultInspectionTemplates in src/lib/defaults/data/inspection-templates.ts`
        );
      }
      const result = await tx.inspectionTemplate.upsert({
        where: { companyId_code: { companyId, code: item.code } },
        update: {},
        create: {
          companyId,
          code: item.code,
          sectionId: sectionId,
          name: item.name,
          nameAr: item.nameAr,
          description: item.description,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        },
      });
      templateMap.set(item.code, result.id);
    }

    // =====================================================
    // Inspection Categories
    // =====================================================
    const categoryMap = new Map<string, string>();
    for (const item of defaultInspectionCategories) {
      const templateId = templateMap.get(item.templateCode);
      if (!templateId) {
        throw new Error(
          `❌ Template "${item.templateCode}" not found for category "${item.code}". ` +
          `Check defaultInspectionCategories in src/lib/defaults/data/inspection-categories.ts`
        );
      }
      const result = await tx.inspectionCategory.upsert({
        where: { companyId_code: { companyId, code: item.code } },
        update: {},
        create: {
          companyId,
          code: item.code,
          templateId: templateId,
          name: item.name,
          nameAr: item.nameAr,
          description: item.description,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        },
      });
      categoryMap.set(item.code, result.id);
    }

    // =====================================================
    // Inspection Items
    // =====================================================
    for (const item of defaultInspectionItems) {
      const categoryId = categoryMap.get(item.categoryCode);
      if (!categoryId) {
        throw new Error(
          `❌ Category "${item.categoryCode}" not found for item "${item.code}". ` +
          `Check defaultInspectionItems in src/lib/defaults/data/inspection-items.ts`
        );
      }
      await tx.inspectionItem.upsert({
        where: { companyId_code: { companyId, code: item.code } },
        update: {},
        create: {
          companyId,
          code: item.code,
          categoryId: categoryId,
          name: item.name,
          nameAr: item.nameAr,
          description: item.description,
          riskLevel: item.riskLevel,
          inputType: item.inputType,
          autoCreateWorkOrder: item.autoCreateWorkOrder,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        },
      });
    }
  });

  console.log(`✅ Company ${companyId} seeded successfully! (Create-Only mode)`);
}

// ============================================================
// سكريبت CLI (يدعم فقط --id)
// ============================================================
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const idArg = args.find((a) => a.startsWith('--id='));

  if (!idArg) {
    console.error(`
❌ You must provide a company ID.

Usage:
  npm run seed:company -- --id=cm...

Example:
  npm run seed:company -- --id=cms50gy0k0000li7sep4ieqn8
`);
    process.exit(1);
  }

  const companyId = idArg.split('=')[1];

  // تحقق من وجود الشركة
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });

  if (!company) {
    console.error(`❌ Company with ID "${companyId}" not found.`);
    process.exit(1);
  }

  console.log(`📋 Seeding for company: ${company.name} (${company.id})`);
  await seedCompany(companyId);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });