// src/app/[locale]/(dashboard)/work-orders/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import WorkOrdersClient from './WorkOrdersClient';
import type { WorkOrder, WorkOrderStatus, WorkOrderPriority, Asset, Branch, Room, Floor, Building, AssetType } from '@prisma/client';

// تعريف النوع الموسع للعلاقات
type WorkOrderWithRelations = WorkOrder & {
  priority: WorkOrderPriority | null;
  status: WorkOrderStatus | null;
  assetType: AssetType | null;
  branch: Branch | null;
  room: (Room & {
    floor: (Floor & {
      building: Building | null;
    }) | null;
  }) | null;
  workOrderAssets: { asset: Asset }[];
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; statusId?: string; priorityId?: string }>;
}

export default async function WorkOrdersPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  await requirePermission('work_orders.read', session);

  const { locale } = await params;
  const { q = '', statusId = '', priorityId = '', page = '1' } = await searchParams;
  const companyId = session.user.companyId!;
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
  const branchIds = session.user.branchIds || [];

  const limit = 10;
  const currentPage = parseInt(page);
  const skip = (currentPage - 1) * limit;

  // شرط التصفية الأساسي
  const where: any = { companyId, deletedAt: null };
  if (!isAdmin) {
    if (branchIds.length > 0) {
      where.branchId = { in: branchIds };
    } else {
      return (
        <WorkOrdersClient
          initialWorkOrders={[]}
          statuses={[]}
          priorities={[]}
          total={0}
          currentPage={1}
          totalPages={1}
          q={q}
          statusId={statusId}
          priorityId={priorityId}
          locale={locale}
        />
      );
    }
  }

  if (statusId && statusId !== 'all') where.statusId = statusId;
  if (priorityId && priorityId !== 'all') where.priorityId = priorityId;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ];
  }

  // جلب الصفحة الحالية فقط مع العلاقات
  const [workOrders, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        priority: true,
        status: true,
        assetType: true,
        branch: true,
        room: {
          include: {
            floor: { include: { building: true } },
          },
        },
        workOrderAssets: {
          include: { asset: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.workOrder.count({ where }),
  ]);

  // تحويل البيانات للعميل - مع تحويل القيم null إلى قيم مناسبة
  const transformedWorkOrders = (workOrders as WorkOrderWithRelations[]).map((wo) => ({
    id: wo.id,
    code: wo.code ?? '', // تحويل null إلى نص فارغ
    title: wo.title,
    description: wo.description,
    type: wo.type as string, // تحويل enum إلى string
    createdAt: wo.createdAt.toISOString(),
    updatedAt: wo.updatedAt.toISOString(),
    asset: wo.workOrderAssets[0]?.asset || null,
    branch: wo.branch ? { id: wo.branch.id, name: wo.branch.name, nameEn: wo.branch.nameEn ?? undefined } : null,
    room: wo.room ? {
      id: wo.room.id,
      name: wo.room.name,
      nameEn: wo.room.nameEn ?? undefined,
      floor: wo.room.floor ? {
        name: wo.room.floor.name,
        nameEn: wo.room.floor.nameEn ?? undefined,
        building: wo.room.floor.building ? {
          name: wo.room.floor.building.name,
          nameEn: wo.room.floor.building.nameEn ?? undefined,
        } : undefined,
      } : undefined,
    } : null,
    status: wo.status ? {
      id: wo.status.id,
      name: wo.status.name,
      nameEn: wo.status.nameEn ?? undefined,
      color: wo.status.color ?? undefined,
    } : null,
    priority: wo.priority ? {
      id: wo.priority.id,
      name: wo.priority.name,
      nameEn: wo.priority.nameEn ?? undefined,
      color: (wo.priority as any).color ?? undefined,
    } : null,
  }));

  // جلب قوائم الحالات والأولويات للفلاتر
  const [statuses, priorities] = await Promise.all([
    prisma.workOrderStatus.findMany({ where: { companyId }, orderBy: { order: 'asc' } }),
    prisma.workOrderPriority.findMany({ where: { companyId }, orderBy: { order: 'asc' } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <WorkOrdersClient
      initialWorkOrders={transformedWorkOrders}
      statuses={statuses}
      priorities={priorities}
      total={total}
      currentPage={currentPage}
      totalPages={totalPages}
      q={q}
      statusId={statusId}
      priorityId={priorityId}
      locale={locale}
    />
  );
}