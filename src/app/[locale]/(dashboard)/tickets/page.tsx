// src/app/[locale]/(dashboard)/tickets/page.tsx

import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import type { Prisma, TicketStatus } from '@prisma/client';
import TicketsClient from './TicketsClient';
import type { Ticket } from './types';

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const session = await getAuthSession().catch(() => null);
  if (!session) redirect('/login');

  const { locale } = await params;
  const { q = "", status = "all", page = "1" } = await searchParams;

  const companyId = session.companyId;
  if (!companyId) {
    redirect('/login');
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
  const branchIds = session.branchIds || [];

  // =========================
  // Build Where Clause
  // =========================
  const where: Prisma.TicketWhereInput = {
    companyId,
    deletedAt: null,
  };

  if (!isAdmin) {
    if (branchIds.length > 0) {
      where.branchId = { in: branchIds };
    } else {
      return (
        <TicketsClient
          initialTickets={[]}
          initialSearch={q}
          initialStatus={status}
          canCreate={true}
          locale={locale}
        />
      );
    }
  }

  if (q.trim()) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { reporterName: { contains: q, mode: 'insensitive' } },
      { reporterEmail: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (status !== "all") {
    where.status = status as TicketStatus;
  }

  // =========================
  // Pagination (offset)
  // =========================
  const limit = 10;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (currentPage - 1) * limit;

  // =========================
  // Fetch Data (بدون count)
  // =========================
  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      asset: true,
      room: {
        include: {
          floor: {
            include: { building: true }
          }
        }
      },
      branch: true,
      attachments: true,
      workOrder: true,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  // =========================
  // Serialize dates (including attachments)
  // =========================
  const serializedTickets: Ticket[] = tickets.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt?.toISOString(),
    attachments: t.attachments?.map((a) => ({
      ...a,
      createdAt: a.createdAt?.toISOString(),
    })),
  }));

  // =========================
  // Render
  // =========================
  return (
    <TicketsClient
      initialTickets={serializedTickets}
      initialSearch={q}
      initialStatus={status}
      canCreate={true}
      locale={locale}
    />
  );
}