// src/lib/repositories/ticket.repository.ts

import { Prisma } from '@prisma/client';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getAuthSession, getBranchFilter } from '@/lib/auth/auth-helper';
import { ticketListSelect } from '@/lib/selects/ticket/list.select';

export interface TicketFindManyOptions {
  where?: Prisma.TicketWhereInput;
  select?: Prisma.TicketSelect;
  limit?: number;
  cursor?: { id: string } | undefined;
  orderBy?: Prisma.TicketOrderByWithRelationInput;
}

export class TicketRepository {
  /**
   * جلب قائمة التذاكر مع Cursor Pagination
   */
  static findMany = cache(async (options: TicketFindManyOptions = {}) => {
    const session = await getAuthSession();
    if (!session) throw new Error('Unauthorized: No session found');
    const companyId = session.companyId!;

    const branchFilter = getBranchFilter(session);

    const {
      where = {},
      select = ticketListSelect,
      limit = 30,
      cursor,
      orderBy = { createdAt: 'desc' },
    } = options;

    const baseWhere: Prisma.TicketWhereInput = {
      companyId,
      deletedAt: null,
      ...branchFilter,
      ...where,
    };

    const queryOptions: Prisma.TicketFindManyArgs = {
      where: baseWhere,
      select,
      take: limit,
      orderBy,
    };

    if (cursor?.id) {
      queryOptions.cursor = { id: cursor.id };
      queryOptions.skip = 1;
    }

    const data = await prisma.ticket.findMany(queryOptions);
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
   * جلب عدد التذاكر
   */
  static count = cache(async (where: Prisma.TicketWhereInput = {}) => {
    const session = await getAuthSession();
    if (!session) throw new Error('Unauthorized: No session found');
    const companyId = session.companyId!;

    const branchFilter = getBranchFilter(session);

    const baseWhere: Prisma.TicketWhereInput = {
      companyId,
      deletedAt: null,
      ...branchFilter,
      ...where,
    };

    return prisma.ticket.count({ where: baseWhere });
  });

  /**
   * جلب تذكرة واحدة بالمعرف مع تفاصيل كاملة
   */
  static findById = cache(async (id: string) => {
    const session = await getAuthSession();
    if (!session) throw new Error('Unauthorized: No session found');
    const companyId = session.companyId!;

    const branchFilter = getBranchFilter(session);

    const where: Prisma.TicketWhereInput = {
      id,
      companyId,
      deletedAt: null,
      ...branchFilter,
    };

    // ✅ الحل: لا تستخدم : Prisma.TicketSelect، استخدم satisfies
    const detailSelect = {
      ...ticketListSelect,
      // إضافة الحقول الإضافية المطلوبة للتفاصيل
      attachments: {
        select: {
          id: true,
          url: true,
          key: true,
          provider: true,
          mimeType: true,
          size: true,
          originalName: true,
          createdAt: true,
        },
      },
      // ✅ دمج workOrder مع الحقول الإضافية (يتم دمجها مع workOrder من ticketListSelect)
      workOrder: {
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          status: {
            select: { id: true, name: true, color: true },
          },
          priority: {
            select: { id: true, name: true, color: true },
          },
          createdAt: true,
        },
      },
    } satisfies Prisma.TicketSelect; // ✅ استخدام satisfies بدلاً من النوع الصريح

    return prisma.ticket.findFirst({
      where,
      select: detailSelect,
    });
  });

  /**
   * البحث عن التذاكر
   */
  static search = cache(async (searchTerm: string, options: { limit?: number } = {}) => {
    const session = await getAuthSession();
    if (!session) throw new Error('Unauthorized: No session found');
    const companyId = session.companyId!;

    const branchFilter = getBranchFilter(session);
    const limit = options.limit || 20;

    const where: Prisma.TicketWhereInput = {
      companyId,
      deletedAt: null,
      ...branchFilter,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { reporterName: { contains: searchTerm, mode: 'insensitive' } },
        { reporterEmail: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    return prisma.ticket.findMany({
      where,
      select: ticketListSelect,
      take: limit,
      orderBy: { title: 'asc' },
    });
  });

  /**
   * إحصائيات سريعة للتذاكر (للـ Dashboard)
   */
  static getDashboardStats = cache(async () => {
    const session = await getAuthSession();
    if (!session) throw new Error('Unauthorized: No session found');
    const companyId = session.companyId!;

    const branchFilter = getBranchFilter(session);

    const where: Prisma.TicketWhereInput = {
      companyId,
      deletedAt: null,
      ...branchFilter,
    };

    const total = await prisma.ticket.count({ where });

    const byStatus = await prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const byType = await prisma.ticket.groupBy({
      by: ['type'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return {
      total,
      byStatus,
      byType,
    };
  });
}