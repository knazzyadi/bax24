// src/lib/repositories/inspection-section.repository.ts
import { prisma } from '@/lib/prisma';
import type { InspectionSection } from '@prisma/client';

export const InspectionSectionRepository = {
  /**
   * جلب جميع الأقسام لشركة معينة
   */
  async findAll(companyId: string) {
    return prisma.inspectionSection.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  /**
   * جلب قسم معين بواسطة ID
   */
  async findById(id: string, companyId: string) {
    return prisma.inspectionSection.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        templates: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  },

  /**
   * جلب قسم بواسطة الكود
   */
  async findByCode(code: string, companyId: string) {
    return prisma.inspectionSection.findFirst({
      where: {
        code,
        companyId,
        deletedAt: null,
      },
    });
  },

  /**
   * إنشاء قسم جديد
   */
  async create(data: Omit<InspectionSection, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return prisma.inspectionSection.create({
      data,
    });
  },

  /**
   * تحديث قسم
   */
  async update(
    id: string,
    companyId: string,
    data: Partial<Omit<InspectionSection, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
  ) {
    // التأكد من أن القسم ينتمي للشركة
    await prisma.inspectionSection.findFirstOrThrow({
      where: { id, companyId },
    });

    return prisma.inspectionSection.update({
      where: { id },
      data,
    });
  },

  /**
   * حذف قسم (حذف منطقي)
   */
  async delete(id: string, companyId: string) {
    // التأكد من أن القسم ينتمي للشركة
    await prisma.inspectionSection.findFirstOrThrow({
      where: { id, companyId },
    });

    return prisma.inspectionSection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};