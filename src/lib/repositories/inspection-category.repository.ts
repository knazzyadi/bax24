// src/lib/repositories/inspection-category.repository.ts
import { prisma } from '@/lib/prisma';
import type { InspectionCategory } from '@prisma/client';

export const InspectionCategoryRepository = {
  /**
   * جلب جميع الفئات لشركة معينة (اختياري: حسب النموذج)
   */
  async findAll(companyId: string, templateId?: string) {
    return prisma.inspectionCategory.findMany({
      where: {
        companyId,
        templateId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });
  },

  /**
   * جلب فئة معينة بواسطة ID
   */
  async findById(id: string, companyId: string) {
    return prisma.inspectionCategory.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        template: true,
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  },

  /**
   * جلب فئة بواسطة الكود
   */
  async findByCode(code: string, companyId: string) {
    return prisma.inspectionCategory.findFirst({
      where: {
        code,
        companyId,
        deletedAt: null,
      },
    });
  },

  /**
   * إنشاء فئة جديدة
   */
  async create(data: Omit<InspectionCategory, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return prisma.inspectionCategory.create({
      data,
    });
  },

  /**
   * تحديث فئة
   */
  async update(
    id: string,
    companyId: string,
    data: Partial<Omit<InspectionCategory, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
  ) {
    // التأكد من أن الفئة تنتمي للشركة
    await prisma.inspectionCategory.findFirstOrThrow({
      where: { id, companyId },
    });

    return prisma.inspectionCategory.update({
      where: { id },
      data,
    });
  },

  /**
   * حذف فئة (حذف منطقي)
   */
  async delete(id: string, companyId: string) {
    // التأكد من أن الفئة تنتمي للشركة
    await prisma.inspectionCategory.findFirstOrThrow({
      where: { id, companyId },
    });

    return prisma.inspectionCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};