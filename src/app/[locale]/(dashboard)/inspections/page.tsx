// src/app/[locale]/(dashboard)/inspections/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import InspectionsClient from './InspectionsClient';
import type { Inspection } from './types';
import { Prisma } from '@prisma/client';

export default async function InspectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string; limit?: string }>;
}) {
  const paramsResolved = await params;
  const searchParamsResolved = await searchParams || {};

  let session;
  try {
    session = await getAuthenticatedSession();
  } catch {
    redirect('/login');
  }

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/login');
  }

  const { locale } = paramsResolved;
  const { q, status, page = '1', limit = '10' } = searchParamsResolved;
  const companyId = session.companyId;

  if (!companyId) {
    redirect('/login');
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.InspectionWhereInput = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (status && status !== 'all') {
    where.status = status as any;
  }

  const [inspections, totalCount] = await Promise.all([
    prisma.inspection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        selectedCategories: {
          include: { category: true }
        },
        results: true
      }
    }),
    prisma.inspection.count({ where })
  ]);

  const transformedInspections: Inspection[] = inspections.map((ins) => ({
    ...ins,
    scheduledDate: ins.scheduledDate.toISOString(),
    createdAt: ins.createdAt.toISOString(),
    updatedAt: ins.updatedAt.toISOString(),
    _count: {
      totalItems: ins.results.length,
      completedItems: ins.results.filter(r => r.result !== 'na').length
    }
  }));

  const statuses = [
    { id: 'all', name: 'الكل', nameEn: 'All' },
    { id: 'draft', name: 'مسودة', nameEn: 'Draft' },
    { id: 'in_progress', name: 'قيد التنفيذ', nameEn: 'In Progress' },
    { id: 'completed', name: 'مكتمل', nameEn: 'Completed' },
    { id: 'approved', name: 'معتمد', nameEn: 'Approved' },
    { id: 'cancelled', name: 'ملغي', nameEn: 'Cancelled' }, // ✅ أضف هذا
  ];

  const baseUrl = `/${locale}/inspections`;
  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (status && status !== 'all') queryParams.set('status', status);
  if (limit) queryParams.set('limit', limit);

  const totalPages = Math.ceil(totalCount / limitNum);
  const nextUrl = pageNum < totalPages
    ? `${baseUrl}?${queryParams.toString()}&page=${pageNum + 1}`
    : null;
  const prevUrl = pageNum > 1
    ? `${baseUrl}?${queryParams.toString()}&page=${pageNum - 1}`
    : null;

  return (
    <InspectionsClient
      initialInspections={transformedInspections}
      statuses={statuses}
      q={q || ''}
      statusFilter={status || ''}
      locale={locale}
      pagination={{
        hasMore: pageNum < totalPages,
        nextUrl,
        prevUrl,
        currentCount: inspections.length,
        totalCount,
        startIndex: totalCount > 0 ? skip + 1 : 0,
        currentPage: pageNum,
        totalPages,
      }}
    />
  );
}