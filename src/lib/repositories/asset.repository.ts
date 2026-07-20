// src/lib/repositories/asset.repository.ts

import { prisma } from '@/lib/prisma';
import { cache } from 'react';
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

// ============================================================
// 1. تعريف select ثابت باستخدام Prisma.validator
//    مطابق تماماً لنموذج Asset في schema.prisma
// ============================================================
const assetSelect = Prisma.validator<Prisma.AssetSelect>()({
  // الحقول الأساسية
  id: true,
  code: true,
  name: true,
  nameEn: true,
  description: true,
  serialNumber: true,
  manufacturer: true,
  model: true,
  purchaseDate: true,
  operationDate: true,
  warrantyEnd: true,
  lastMaintenanceDate: true,
  notes: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,

  // المعرفات (للمرجعية)
  typeId: true,
  statusId: true,
  roomId: true,
  companyId: true,
  buildingId: true,
  branchId: true,
  supplierId: true,

  // العلاقات
  type: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  status: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      code: true,
      color: true,
    },
  },
  room: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      floor: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          building: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                },
              },
            },
          },
        },
      },
    },
  },
  supplier: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  building: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  company: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
});

// ============================================================
// 2. استنتاج النوع للاستخدام في بقية التطبيق
// ============================================================
export type AssetWithRelations = Prisma.AssetGetPayload<{
  select: typeof assetSelect;
}>;

// ============================================================
// 3. الـ Repository المعدل - يرث من BaseRepository
// ============================================================
export class AssetRepository extends BaseRepository {
  /**
   * جلب قائمة الأصول مع التصفية والترقيم
   */
  static findMany = cache(
    async ({
      where,
      orderBy,
      skip,
      limit,
    }: {
      where?: Prisma.AssetWhereInput;
      orderBy?: Prisma.AssetOrderByWithRelationInput;
      skip?: number;
      limit?: number;
    }) => {
      // ✅ استخدم الخصائص المسطحة مباشرة (بدون user)
      const { companyId } = await this.company();

      const assets = await prisma.asset.findMany({
        where: {
          ...where,
          companyId,
        },
        select: assetSelect,
        orderBy,
        skip,
        take: limit,
      });

      return {
        data: assets,
        pagination: {
          skip: skip || 0,
          limit: limit || 10,
        },
      };
    }
  );

  /**
   * حساب عدد الأصول حسب الشروط
   */
  static count = cache(
    async (where?: Prisma.AssetWhereInput) => {
      const { companyId } = await this.company();

      return prisma.asset.count({
        where: {
          ...where,
          companyId,
        },
      });
    }
  );

  /**
   * جلب أصل واحد بواسطة المعرف
   */
  static findById = cache(
    async (id: string) => {
      const { companyId } = await this.company();

      return prisma.asset.findUnique({
        where: {
          id,
          companyId,
        },
        select: assetSelect,
      });
    }
  );

  /**
   * جلب أنواع الأصول (للفلاتر)
   */
  static getTypes = cache(async () => {
    const { companyId } = await this.company();

    return prisma.assetType.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  });

  /**
   * جلب حالات الأصول (للفلاتر)
   */
  static getStatuses = cache(async () => {
    const { companyId } = await this.company();

    return prisma.assetStatus.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  });

  /**
   * جلب إحصائيات لوحة التحكم
   */
  static getDashboardStats = cache(async () => {
    const { companyId } = await this.company();

    const [total, byStatus] = await Promise.all([
      prisma.asset.count({
        where: { companyId },
      }),
      prisma.asset.groupBy({
        by: ['statusId'],
        where: { companyId },
        _count: true,
      }),
    ]);
    return { total, byStatus };
  });
}