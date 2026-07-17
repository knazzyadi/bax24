// src/lib/repositories/asset.repository.ts

import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/auth-helper';
import { cache } from 'react';
import { Prisma } from '@prisma/client';

// ============================================================
// 1. تعريف select ثابت باستخدام Prisma.validator
//    مطابق تماماً لنموذج Asset في schema.prisma
// ============================================================
const assetSelect = Prisma.validator<Prisma.AssetSelect>()({
  // الحقول الأساسية
  id: true,
  code: true,
  name: true,                // ✅ بدلاً من title
  nameEn: true,
  description: true,
  serialNumber: true,
  manufacturer: true,
  model: true,               // حقل model الخاص بالأصل (وليس العلاقة)
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

  // ============================================================
  // العلاقات (باستخدام select داخلي)
  // ============================================================
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
      color: true,   // تأكد من وجوده في نموذج AssetStatus
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
  supplier: {                // ✅ علاقة المورد بدلاً من supplierName
    select: {
      id: true,
      name: true,
      nameEn: true,
      // أضف أي حقول أخرى تحتاجها من Supplier
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
// 3. الـ Repository الكامل
// ============================================================
export class AssetRepository {
  /**
   * الحصول على الجلسة الحالية مع companyId
   */
  private static async getSession() {
    const session = await getAuthSession();
    if (!session?.companyId) {
      throw new Error('Unauthorized: No company ID found');
    }
    return session;
  }

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
      const session = await this.getSession();

      const assets = await prisma.asset.findMany({
        where: {
          ...where,
          companyId: session.companyId,
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
      const session = await this.getSession();
      return prisma.asset.count({
        where: {
          ...where,
          companyId: session.companyId,
        },
      });
    }
  );

  /**
   * جلب أصل واحد بواسطة المعرف
   */
  static findById = cache(
    async (id: string) => {
      const session = await this.getSession();
      return prisma.asset.findUnique({
        where: {
          id,
          companyId: session.companyId,
        },
        select: assetSelect,
      });
    }
  );

  /**
   * جلب أنواع الأصول (للفلاتر)
   */
  static getTypes = cache(async () => {
    const session = await this.getSession();
    return prisma.assetType.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: 'asc' },
    });
  });

  /**
   * جلب حالات الأصول (للفلاتر)
   */
  static getStatuses = cache(async () => {
    const session = await this.getSession();
    return prisma.assetStatus.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: 'asc' },
    });
  });

  /**
   * جلب إحصائيات لوحة التحكم
   */
  static getDashboardStats = cache(async () => {
    const session = await this.getSession();
    const [total, byStatus] = await Promise.all([
      prisma.asset.count({
        where: { companyId: session.companyId },
      }),
      prisma.asset.groupBy({
        by: ['statusId'],
        where: { companyId: session.companyId },
        _count: true,
      }),
    ]);
    return { total, byStatus };
  });
}