// src/lib/repositories/workorder.repository.ts

import { Prisma } from '@prisma/client';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getAuthSession, getBranchFilter } from '@/lib/auth/auth-helper';

export class WorkOrderRepository {
  static findMany = cache(
    async ({
      where,
      orderBy,
      skip,
      limit,
    }: {
      where?: Prisma.WorkOrderWhereInput;
      orderBy?: Prisma.WorkOrderOrderByWithRelationInput;
      skip?: number;
      limit?: number;
    }) => {
      const session = await getAuthSession();
      if (!session) throw new Error('Unauthorized: No session found');
      const companyId = session.companyId!; // ✅ تأكيد non-null

      const branchFilter = getBranchFilter(session);

      const workOrders = await prisma.workOrder.findMany({
        where: {
          ...where,
          companyId,
          deletedAt: null,
          ...branchFilter,
        },
        orderBy,
        skip,
        take: limit,
      });

      return {
        data: workOrders,
        pagination: {
          skip: skip || 0,
          limit: limit || 10,
        },
      };
    }
  );

  static count = cache(
    async (where?: Prisma.WorkOrderWhereInput) => {
      const session = await getAuthSession();
      if (!session) throw new Error('Unauthorized: No session found');
      const companyId = session.companyId!; // ✅

      const branchFilter = getBranchFilter(session);

      return prisma.workOrder.count({
        where: {
          ...where,
          companyId,
          deletedAt: null,
          ...branchFilter,
        },
      });
    }
  );

  static findById = cache(
    async (id: string) => {
      const session = await getAuthSession();
      if (!session) throw new Error('Unauthorized: No session found');
      const companyId = session.companyId!; // ✅

      const branchFilter = getBranchFilter(session);

      return prisma.workOrder.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null,
          ...branchFilter,
        },
        include: {
          // أضف العلاقات المطلوبة حسب الحاجة
        },
      });
    }
  );

  static getDashboardStats = cache(async () => {
    const session = await getAuthSession();
    if (!session) throw new Error('Unauthorized: No session found');
    const companyId = session.companyId!; // ✅

    const branchFilter = getBranchFilter(session);

    const where: Prisma.WorkOrderWhereInput = {
      companyId,
      deletedAt: null,
      ...branchFilter,
    };

    const [total, byStatus, byPriority] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.groupBy({
        by: ['statusId'],
        where,
        _count: { id: true },
      }),
      prisma.workOrder.groupBy({
        by: ['priorityId'],
        where,
        _count: { id: true },
      }),
    ]);

    return { total, byStatus, byPriority };
  });
}