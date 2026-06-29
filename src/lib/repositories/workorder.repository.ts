// src/lib/repositories/workorder.repository.ts
import { Prisma } from '@prisma/client';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getAuthSession, getBranchFilter } from '@/lib/auth/auth-helper';
import { workOrderListSelect } from '@/lib/selects/workorder/list.select';

export interface WorkOrderFindManyOptions {
  where?: Prisma.WorkOrderWhereInput;
  select?: Prisma.WorkOrderSelect;
  limit?: number;
  cursor?: { id: string } | undefined;
  orderBy?: Prisma.WorkOrderOrderByWithRelationInput;
}

export class WorkOrderRepository {
  /**
   * جلب قائمة أوامر العمل مع Cursor Pagination
   */
  static findMany = cache(async (options: WorkOrderFindManyOptions = {}) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const {
      where = {},
      select = workOrderListSelect,
      limit = 30,
      cursor,
      orderBy = { createdAt: 'desc' },
    } = options;

    const baseWhere: Prisma.WorkOrderWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
      ...where,
    };

    const queryOptions: Prisma.WorkOrderFindManyArgs = {
      where: baseWhere,
      select,
      take: limit,
      orderBy,
    };

    if (cursor?.id) {
      queryOptions.cursor = { id: cursor.id };
      queryOptions.skip = 1;
    }

    const data = await prisma.workOrder.findMany(queryOptions);
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
   * جلب عدد أوامر العمل
   */
  static count = cache(async (where: Prisma.WorkOrderWhereInput = {}) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const baseWhere: Prisma.WorkOrderWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
      ...where,
    };

    return prisma.workOrder.count({ where: baseWhere });
  });

  /**
   * جلب أمر عمل واحد بالمعرف مع تفاصيل كاملة
   */
  static findById = cache(async (id: string) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);

    const where: Prisma.WorkOrderWhereInput = {
      id,
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
    };

    const detailSelect: Prisma.WorkOrderSelect = {
      ...workOrderListSelect,
      description: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      workOrderAssets: {
        select: {
          // ✅ تم إزالة id لأنه غير موجود في الـ schema
          completedAt: true,
          notes: true,
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              nameEn: true,
              status: {
                select: { id: true, name: true, color: true },
              },
            },
          },
        },
      },
      attachments: {
        select: {
          id: true,
          url: true,
          fileName: true,
          originalName: true,
          provider: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      },
      workOrderInventory: {
        select: {
          id: true,
          quantity: true,
          notes: true,
          inventoryItem: {
            select: {
              id: true,
              name: true,
              sku: true,
              quantity: true,
            },
          },
        },
      },
      ticket: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
        },
      },
    };

    return prisma.workOrder.findFirst({
      where,
      select: detailSelect,
    });
  });

  /**
   * البحث عن أوامر العمل
   */
  static search = cache(async (searchTerm: string, options: { limit?: number } = {}) => {
    const session = await getAuthSession();
    const branchFilter = getBranchFilter(session);
    const limit = options.limit || 20;

    const where: Prisma.WorkOrderWhereInput = {
      companyId: session.companyId,
      deletedAt: null,
      ...branchFilter,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    return prisma.workOrder.findMany({
      where,
      select: workOrderListSelect,
      take: limit,
      orderBy: { title: 'asc' },
    });
  });
}