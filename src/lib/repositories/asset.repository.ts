// src/lib/repositories/asset.repository.ts
import { Prisma } from '@prisma/client';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getAuthSession, getBranchFilter } from '@/lib/auth/auth-helper';
import { assetListSelect } from '@/lib/selects/asset/list.select';
import { assetDashboardSelect } from '@/lib/selects/asset/dashboard.select';

export interface AssetPaginationParams {
  limit?: number;
  cursor?: string;
  search?: string;
  statusId?: string;
  typeId?: string;
  roomId?: string;
  buildingId?: string;
}

export interface AssetFindManyOptions {
  where?: Prisma.AssetWhereInput;
  select?: Prisma.AssetSelect;
  limit?: number;
  skip?: number; // ✅ أضف هذا
  cursor?: { id: string } | undefined;
  orderBy?: Prisma.AssetOrderByWithRelationInput;
}

export class AssetRepository {
  /**
   * جلب قائمة الأصول مع Cursor Pagination
   */
  static findMany = cache(async (options: AssetFindManyOptions = {}) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const {
      where = {},
      select = assetListSelect,
      limit = 30,
      skip, // ✅ أضف skip إلى عملية التدمير
      cursor,
      orderBy = { createdAt: 'desc' },
    } = options;

    const baseWhere: Prisma.AssetWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
      ...where,
    };

    const queryOptions: Prisma.AssetFindManyArgs = {
      where: baseWhere,
      select,
      take: limit,
      skip, // ✅ استخدم skip
      orderBy,
    };

    if (cursor?.id) {
      queryOptions.cursor = { id: cursor.id };
      queryOptions.skip = 1;
    }

    const data = await prisma.asset.findMany(queryOptions);
    const hasMore = data.length === limit;
    const nextCursor = hasMore ? data[data.length - 1].id : undefined;

    return {
      data,
      pagination: {
        hasMore,
        nextCursor,
        total: data.length,
      },
    };
  });

  /**
   * جلب عدد الأصول
   */
  static count = cache(async (where: Prisma.AssetWhereInput = {}) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const baseWhere: Prisma.AssetWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
      ...where,
    };

    return prisma.asset.count({ where: baseWhere });
  });

  /**
   * جلب أصل واحد بالمعرف مع تفاصيل كاملة
   * ✅ تم تغيير findUnique → findFirst ليتيح استخدام شروط إضافية
   */
  static findById = cache(async (id: string) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const where: Prisma.AssetWhereInput = {
      id,
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
    };

    const detailSelect: Prisma.AssetSelect = {
      ...assetListSelect,
      notes: true,
      qrCode: true,
      purchaseDate: true,
      warrantyEnd: true,
      createdAt: true,
      updatedAt: true,
      lastMaintenanceDate: true,
      tickets: {
        where: { deletedAt: null },
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      workOrderAssets: {
        select: {
          workOrder: {
            select: {
              id: true,
              code: true,
              title: true,
              status: {
                select: { id: true, name: true, color: true },
              },
              createdAt: true,
            },
          },
        },
        take: 5,
        orderBy: { workOrder: { createdAt: 'desc' } },
      },
      scheduleAssets: {
        select: {
          schedule: {
            select: {
              id: true,
              name: true,
              frequency: true,
              lastRunAt: true,
            },
          },
        },
      },
    };

    return prisma.asset.findFirst({
      where,
      select: detailSelect,
    });
  });

  /**
   * جلب إحصائيات سريعة للداشبورد
   */
  static getDashboardStats = cache(async () => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const where: Prisma.AssetWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
    };

    const total = await prisma.asset.count({ where });

    const byStatus = await prisma.asset.groupBy({
      by: ['statusId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const byType = await prisma.asset.groupBy({
      by: ['typeId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const byBuilding = await prisma.asset.groupBy({
      by: ['buildingId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    return {
      total,
      byStatus,
      byType,
      byBuilding,
    };
  });

  /**
   * البحث عن الأصول
   */
  static search = cache(async (searchTerm: string, options: { limit?: number } = {}) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);
    const limit = options.limit || 20;

    const where: Prisma.AssetWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { nameEn: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    return prisma.asset.findMany({
      where,
      select: assetListSelect,
      take: limit,
      orderBy: { name: 'asc' },
    });
  });
}