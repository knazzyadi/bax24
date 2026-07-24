// src/lib/repositories/inspection-template.repository.ts
import { prisma } from '@/lib/prisma';
import type { InspectionTemplate } from '@prisma/client';

export const InspectionTemplateRepository = {
  /**
   * جلب جميع النماذج لشركة معينة (اختياري: حسب القسم)
   */
  async findAll(companyId: string, sectionId?: string) {
    return prisma.inspectionTemplate.findMany({
      where: {
        companyId,
        sectionId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        section: true,
        _count: {
          select: { categories: true },
        },
      },
    });
  },

  /**
   * جلب نموذج معين بواسطة ID
   */
  async findById(id: string, companyId: string) {
    return prisma.inspectionTemplate.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        section: true,
        categories: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { items: true },
            },
          },
        },
      },
    });
  },

  /**
   * جلب نموذج بواسطة الكود
   */
  async findByCode(code: string, companyId: string) {
    return prisma.inspectionTemplate.findFirst({
      where: {
        code,
        companyId,
        deletedAt: null,
      },
    });
  },

  /**
   * إنشاء نموذج جديد
   */
  async create(data: Omit<InspectionTemplate, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return prisma.inspectionTemplate.create({
      data,
    });
  },

  /**
   * تحديث نموذج
   */
  async update(
    id: string,
    companyId: string,
    data: Partial<Omit<InspectionTemplate, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
  ) {
    // التأكد من أن النموذج ينتمي للشركة
    await prisma.inspectionTemplate.findFirstOrThrow({
      where: { id, companyId },
    });

    return prisma.inspectionTemplate.update({
      where: { id },
      data,
    });
  },

  /**
   * حذف نموذج (حذف منطقي)
   */
  async delete(id: string, companyId: string) {
    // التأكد من أن النموذج ينتمي للشركة
    await prisma.inspectionTemplate.findFirstOrThrow({
      where: { id, companyId },
    });

    return prisma.inspectionTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};