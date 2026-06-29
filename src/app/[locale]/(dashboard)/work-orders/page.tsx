// src/app/[locale]/(dashboard)/work-orders/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { WorkOrderRepository } from '@/lib/repositories/workorder.repository';
import { getAuthSession } from '@/lib/auth/auth-helper';
import WorkOrdersClient from './WorkOrdersClient';
import type { Prisma } from '@prisma/client';

// =========================
// Types
// =========================
type WorkOrderType = "MAINTENANCE" | "CORRECTIVE" | "EMERGENCY" | "BULK_PREVENTIVE";

interface TransformedWorkOrder {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: WorkOrderType;
  priority: {
    id: string;
    name: string;
    nameEn?: string;
    color?: string;
  } | null;
  status: {
    id: string;
    name: string;
    nameEn?: string;
    color?: string;
  } | null;
  branch: {
    id: string;
    name: string;
    nameEn?: string;
  } | null;
  room: {
    id: string;
    name: string;
    nameEn?: string;
    floor?: {
      name: string;
      nameEn?: string;
      building?: {
        name: string;
        nameEn?: string;
      };
    };
  } | null;
  createdAt: string;
  asset: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// =========================
// Helpers
// =========================
function transformWorkOrder(wo: any): TransformedWorkOrder {
  const asset = wo.workOrderAssets?.[0]?.asset;

  return {
    id: wo.id,
    code: wo.code || `WO-${wo.id.slice(-4)}`,
    title: wo.title,
    description: wo.description || null,
    type: wo.type || "MAINTENANCE",
    priority: wo.priority
      ? {
          id: wo.priority.id,
          name: wo.priority.name,
          nameEn: wo.priority.nameEn ?? undefined,
          color: wo.priority.color ?? undefined,
        }
      : null,
    status: wo.status
      ? {
          id: wo.status.id,
          name: wo.status.name,
          nameEn: wo.status.nameEn ?? undefined,
          color: wo.status.color ?? undefined,
        }
      : null,
    branch: wo.branch
      ? {
          id: wo.branch.id,
          name: wo.branch.name,
          nameEn: wo.branch.nameEn ?? undefined,
        }
      : null,
    room: wo.room
      ? {
          id: wo.room.id,
          name: wo.room.name,
          nameEn: wo.room.nameEn ?? undefined,
          floor: wo.room.floor
            ? {
                name: wo.room.floor.name,
                nameEn: wo.room.floor.nameEn ?? undefined,
                building: wo.room.floor.building
                  ? {
                      name: wo.room.floor.building.name,
                      nameEn: wo.room.floor.building.nameEn ?? undefined,
                    }
                  : undefined,
              }
            : undefined,
        }
      : null,
    createdAt: wo.createdAt.toISOString(),
    asset: asset
      ? {
          id: asset.id,
          name: asset.name,
          code: asset.code,
        }
      : null,
  };
}

// =========================
// Page
// =========================
export default async function WorkOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    statusId?: string;
    priorityId?: string;
    page?: string;
  }>;
}) {
  // ========================= Auth =========================
  const session = await getAuthSession().catch(() => null);
  if (!session) redirect('/login');

  // ========================= Params =========================
  const { locale } = await params;
  const {
    q = '',
    statusId = 'all',
    priorityId = 'all',
    page = '1',
  } = await searchParams;

  const companyId = session.companyId;
  const limit = 10;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (currentPage - 1) * limit;

  // ========================= Build Where =========================
  const where: Prisma.WorkOrderWhereInput = {
    companyId,
    deletedAt: null,
  };

  if (q.trim()) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (statusId !== 'all') where.statusId = statusId;
  if (priorityId !== 'all') where.priorityId = priorityId;

  // ========================= Get Total Count =========================
  const totalCount = await WorkOrderRepository.count(where);

  // ========================= Fetch Data (using offset pagination) =========================
  const allWorkOrders = await WorkOrderRepository.findMany({
    where,
    limit: limit,
    // نستخدم skip بدلاً من cursor لأن العميل الحالي يعتمد على page
    // سنقوم بجلب الكل ثم التقطيع يدوياً (أو نعدل الـ Repository لدعم offset)
  });

  // بدلاً من استخدام cursor، نقوم بتقطيع النتائج يدوياً
  const workOrders = allWorkOrders.data.slice(skip, skip + limit);
  const totalPages = Math.ceil(totalCount / limit);

  // ========================= Transform Data =========================
  const transformedWorkOrders = workOrders.map(transformWorkOrder);

  // ========================= Fetch Statuses & Priorities =========================
  const [rawStatuses, rawPriorities] = await Promise.all([
    prisma.workOrderStatus.findMany({
      where: { companyId },
      select: { id: true, name: true, nameEn: true },
    }),
    prisma.workOrderPriority.findMany({
      where: { companyId },
      select: { id: true, name: true, nameEn: true },
    }),
  ]);

  const statuses = rawStatuses.map((s) => ({
    id: s.id,
    name: s.name,
    nameEn: s.nameEn ?? undefined,
  }));

  const priorities = rawPriorities.map((p) => ({
    id: p.id,
    name: p.name,
    nameEn: p.nameEn ?? undefined,
  }));

  // ========================= Render =========================
  return (
    <WorkOrdersClient
      initialWorkOrders={transformedWorkOrders}
      statuses={statuses}
      priorities={priorities}
      total={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      q={q}
      statusId={statusId}
      priorityId={priorityId}
      locale={locale}
    />
  );
}