// src/lib/repositories/inventory.repository.ts
import { Prisma } from '@prisma/client';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getAuthSession, getBranchFilter } from '@/lib/auth/auth-helper';
import { inventoryListSelect } from '@/lib/selects/inventory/list.select';

export interface InventoryFindManyOptions {
  where?: Prisma.InventoryItemWhereInput;
  select?: Prisma.InventoryItemSelect;
  limit?: number;
  cursor?: { id: string } | undefined;
  orderBy?: Prisma.InventoryItemOrderByWithRelationInput;
}

export class InventoryRepository {
  /**
   * جلب قائمة المخزون مع Cursor Pagination
   */
  static findMany = cache(async (options: InventoryFindManyOptions = {}) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const {
      where = {},
      select = inventoryListSelect,
      limit = 30,
      cursor,
      orderBy = { createdAt: 'desc' },
    } = options;

    const baseWhere: Prisma.InventoryItemWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
      ...where,
    };

    const queryOptions: Prisma.InventoryItemFindManyArgs = {
      where: baseWhere,
      select,
      take: limit,
      orderBy,
    };

    if (cursor?.id) {
      queryOptions.cursor = { id: cursor.id };
      queryOptions.skip = 1;
    }

    const data = await prisma.inventoryItem.findMany(queryOptions);
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
   * جلب عدد عناصر المخزون
   */
  static count = cache(async (where: Prisma.InventoryItemWhereInput = {}) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const baseWhere: Prisma.InventoryItemWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
      ...where,
    };

    return prisma.inventoryItem.count({ where: baseWhere });
  });

  /**
   * جلب عنصر مخزون واحد بالمعرف مع تفاصيل كاملة
   * ✅ استخدم include بدلاً من select لتجنب تعقيد الأنواع
   */
  static findById = cache(async (id: string) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const where: Prisma.InventoryItemWhereInput = {
      id,
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
    };

    // ✅ استخدام include بدلاً من select لحل مشكلة تعقيد الأنواع
    return prisma.inventoryItem.findFirst({
      where,
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    branch: true,
                  },
                },
              },
            },
          },
        },
        workOrderInventory: {
          include: {
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
          take: 10,
          orderBy: { workOrder: { createdAt: 'desc' } },
        },
      },
    });
  });

  /**
   * البحث عن عناصر المخزون
   */
  static search = cache(async (searchTerm: string, options: { limit?: number } = {}) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);
    const limit = options.limit || 20;

    const where: Prisma.InventoryItemWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { nameEn: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    return prisma.inventoryItem.findMany({
      where,
      select: inventoryListSelect,
      take: limit,
      orderBy: { name: 'asc' },
    });
  });

  /**
   * إحصائيات سريعة للمخزون (للـ Dashboard)
   */
  static getDashboardStats = cache(async () => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const where: Prisma.InventoryItemWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
    };

    const total = await prisma.inventoryItem.count({ where });

    // عدد العناصر التي تحتاج إعادة طلب (الكمية <= الحد الأدنى)
    const lowStock = await prisma.inventoryItem.count({
      where: {
        ...where,
        quantity: { lte: prisma.inventoryItem.fields.minQuantity },
      },
    });

    // أكثر العناصر استخداماً (بناءً على workOrderInventory)
    const mostUsed = await prisma.inventoryItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        _count: {
          select: { workOrderInventory: true },
        },
      },
      orderBy: {
        workOrderInventory: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      total,
      lowStock,
      mostUsed,
    };
  });
}