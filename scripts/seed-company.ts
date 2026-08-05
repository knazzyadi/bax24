// scripts/seed-company.ts
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
// نوع عام لـ Prisma delegates التي تدعم createMany
// ============================================================
type CreateManyDelegate<T> = {
  createMany: (args: {
    data: Array<T & { companyId: string }>;
    skipDuplicates?: boolean;
  }) => Promise<unknown>;
};

// ============================================================
// دالة عامة للجداول البسيطة (Create-Only)
// ============================================================
async function seedSimpleTable<T>(
  model: CreateManyDelegate<T>,
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
    await seedSimpleTable(tx.workOrderType, companyId, defaultWorkOrderTypes);

    await seedSimpleTable(
      tx.workOrderPriority,
      companyId,
      defaultWorkOrderPriorities
    );

    await seedSimpleTable(
      tx.workOrderStatus,
      companyId,
      defaultWorkOrderStatuses
    );

    await seedSimpleTable(
      tx.workOrderCloseReason,
      companyId,
      defaultWorkOrderCloseReasons
    );

    await seedSimpleTable(
      tx.workOrderCancelReason,
      companyId,
      defaultWorkOrderCancelReasons
    );

    await seedSimpleTable(tx.assetType, companyId, defaultAssetTypes);

    await seedSimpleTable(tx.assetStatus, companyId, defaultAssetStatuses);

    // =====================================================
    // Inspection Sections
    // =====================================================
    const sectionMap = new Map<string, string>();

    for (const item of defaultInspectionSections) {
      const result = await tx.inspectionSection.upsert({
        where: {
          companyId_code: {
            companyId,
            code: item.code,
          },
        },
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
          `❌ Section "${item.sectionCode}" not found for template "${item.code}".`
        );
      }

      const result = await tx.inspectionTemplate.upsert({
        where: {
          companyId_code: {
            companyId,
            code: item.code,
          },
        },
        update: {},
        create: {
          companyId,
          code: item.code,
          sectionId,
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
          `❌ Template "${item.templateCode}" not found for category "${item.code}".`
        );
      }

      const result = await tx.inspectionCategory.upsert({
        where: {
          companyId_code: {
            companyId,
            code: item.code,
          },
        },
        update: {},
        create: {
          companyId,
          code: item.code,
          templateId,
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
          `❌ Category "${item.categoryCode}" not found for item "${item.code}".`
        );
      }

      await tx.inspectionItem.upsert({
        where: {
          companyId_code: {
            companyId,
            code: item.code,
          },
        },
        update: {},
        create: {
          companyId,
          code: item.code,
          categoryId,
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

  console.log(`✅ Company ${companyId} seeded successfully!`);
}

// ============================================================
// CLI
// ============================================================
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const idArg = args.find((a) => a.startsWith('--id='));

  if (!idArg) {
    console.error(`
❌ You must provide a company ID.

Usage:
  npm run seed:company -- --id=cm...
`);
    process.exit(1);
  }

  const companyId = idArg.split('=')[1];

  const company = await prisma.company.findUnique({
    where: {
      id: companyId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!company) {
    console.error(`❌ Company with ID "${companyId}" not found.`);
    process.exit(1);
  }

  console.log(`📋 Seeding for company: ${company.name} (${company.id})`);

  await seedCompany(companyId);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });