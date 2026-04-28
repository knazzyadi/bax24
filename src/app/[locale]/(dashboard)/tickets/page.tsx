// src/app/[locale]/(dashboard)/tickets/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import TicketsClient from './TicketsClient';
import type { Ticket } from './types';

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  await requirePermission('tickets.read', session);

  const { locale } = await params;
  const { q = "", status = "all" } = await searchParams;

  const companyId = session.user.companyId!;
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
  const branchIds = session.user.branchIds || [];

  const where: any = { companyId, deletedAt: null };

  if (!isAdmin) {
    if (branchIds.length > 0) {
      where.branchId = { in: branchIds };
    } else {
      // لا فروع -> قائمة فارغة
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

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (status !== "all") where.status = status;

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
      ticketImages: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // تحويل التواريخ إلى سلاسل
  const serializedTickets: Ticket[] = tickets.map((t: any) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt?.toISOString(),
  }));

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