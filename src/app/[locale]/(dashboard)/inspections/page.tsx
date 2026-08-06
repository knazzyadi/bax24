// src/app/[locale]/(dashboard)/inspections/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import InspectionsClient from './InspectionsClient';
import type { Inspection } from './types';
import { Prisma, InspectionStatus } from '@prisma/client';

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
    where.OR = [{ title: { contains: q, mode: 'insensitive' } }];
  }

  if (status && status !== 'all') {
    if (Object.values(InspectionStatus).includes(status as InspectionStatus)) {
      where.status = status as InspectionStatus;
    }
  }

  const [inspections, totalCount] = await Promise.all([
    prisma.inspection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        branch: true,
        formItems: {
          include: {
            results: true,
          },
        },
      },
    }),
    prisma.inspection.count({ where }),
  ]);

  // ✅ التعديل المطلوب: تعيين الحقول بشكل صريح مع معالجة null
  const transformedInspections: Inspection[] = inspections.map((ins) => ({
    id: ins.id,
    title: ins.title,

    branchId: ins.branchId,
    branch: {
      id: ins.branch.id,
      name: ins.branch.name,
      nameEn: ins.branch.nameEn ?? undefined, // تحويل null إلى undefined
    },

    locationName: undefined,

    scheduledDate: ins.scheduledDate.toISOString(),

    inspectorName: undefined,

    status: ins.status,

    inspectorSignature: undefined,
    supervisorSignature: undefined,

    createdAt: ins.createdAt.toISOString(),
    updatedAt: ins.updatedAt.toISOString(),

    _count: {
      totalItems: ins.formItems.length,
      completedItems: ins.formItems.filter(
        (item) => item.results.some((r) => r.result !== 'na')
      ).length,
    },
  }));

  const statuses = [
    { id: 'all', name: 'الكل', nameEn: 'All' },
    { id: 'draft', name: 'مسودة', nameEn: 'Draft' },
    { id: 'in_progress', name: 'قيد التنفيذ', nameEn: 'In Progress' },
    { id: 'completed', name: 'مكتمل', nameEn: 'Completed' },
    { id: 'approved', name: 'معتمد', nameEn: 'Approved' },
    { id: 'cancelled', name: 'ملغي', nameEn: 'Cancelled' },
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