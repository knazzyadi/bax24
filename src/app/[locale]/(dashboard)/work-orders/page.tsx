
import { redirect } from "next/navigation";

import { prisma } from '@/lib/prisma';
import { getSession, requirePermission } from '@/lib/auth-helper';



import WorkOrdersClient from "./WorkOrdersClient";

import type {
  Prisma,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@prisma/client";

//
// =========================
// Types
// =========================
//

type WorkOrderType =
  | "MAINTENANCE"
  | "CORRECTIVE"
  | "EMERGENCY"
  | "BULK_PREVENTIVE";

const VALID_WORK_ORDER_TYPES = new Set<WorkOrderType>([
  "MAINTENANCE",
  "CORRECTIVE",
  "EMERGENCY",
  "BULK_PREVENTIVE",
]);

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

//
// =========================
// Helpers
// =========================
//

function isValidWorkOrderType(type: string): type is WorkOrderType {
  return VALID_WORK_ORDER_TYPES.has(type as WorkOrderType);
}

type WorkOrderWithRelations = PrismaClient.WorkOrderGetPayload<{
  include: {
    priority: true;
    status: true;
    assetType: true;
    branch: true;
    room: {
      include: {
        floor: {
          include: {
            building: true;
          };
        };
      };
    };
    workOrderAssets: {
      include: {
        asset: true;
      };
    };
  };
}>;

function transformWorkOrder(wo: WorkOrderWithRelations): TransformedWorkOrder {
  const type: WorkOrderType = isValidWorkOrderType(wo.type) ? wo.type : "MAINTENANCE";
  const asset = wo.workOrderAssets?.[0]?.asset;

  return {
    id: wo.id,
    code: wo.code || `WO-${wo.id.slice(-4)}`,
    title: wo.title,
    description: wo.description,
    type,
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

//
// =========================
// Page
// =========================
//

export default async function WorkOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; statusId?: string; priorityId?: string; page?: string }>;
}) {
  //
  // =========================
  // Auth
  // =========================
  //

  const session = await getSession();
  if (!session?.user) redirect("/login");
  await requirePermission("work_orders.read");

  //
  // =========================
  // Params
  // =========================
  //

  const { locale } = await params;
  const { q = "", statusId = "all", priorityId = "all", page = "1" } = await searchParams;

  //
  // =========================
  // User Context
  // =========================
  //

  const companyId = session.user.companyId!;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  const branchIds = session.user.branchIds || [];

  //
  // =========================
  // Filters
  // =========================
  //

  const where: PrismaClient.WorkOrderWhereInput = {
    companyId,
    deletedAt: null,
  };

  if (!isAdmin) {
    if (branchIds.length > 0) {
      where.branchId = { in: branchIds };
    } else {
      // لا فروع مسموحة → قائمة فارغة
      return (
        <WorkOrdersClient
          initialWorkOrders={[]}
          statuses={[]}
          priorities={[]}
          total={0}
          currentPage={1}
          totalPages={0}
          q={q}
          statusId={statusId}
          priorityId={priorityId}
          locale={locale}
        />
      );
    }
  }

  if (q.trim()) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
    ];
  }
  if (statusId !== "all") where.statusId = statusId;
  if (priorityId !== "all") where.priorityId = priorityId;

  //
  // =========================
  // Pagination
  // =========================
  //

  const limit = 10;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const skip = (currentPage - 1) * limit;

  //
  // =========================
  // Queries
  // =========================
  //

  const [workOrders, total, rawStatuses, rawPriorities] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        priority: true,
        status: true,
        assetType: true,
        branch: true,
        room: {
          include: {
            floor: {
              include: { building: true },
            },
          },
        },
        workOrderAssets: {
          include: { asset: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.workOrder.count({ where }),
    prisma.workOrderStatus.findMany({
      where: { companyId },
      select: { id: true, name: true, nameEn: true },
    }),
    prisma.workOrderPriority.findMany({
      where: { companyId },
      select: { id: true, name: true, nameEn: true },
    }),
  ]);

  // تحويل null → undefined لتوافق أنواع WorkOrdersClient
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

  //
  // =========================
  // Transform
  // =========================
  //

  const transformedWorkOrders = workOrders.map(transformWorkOrder);
  const totalPages = Math.ceil(total / limit);

  //
  // =========================
  // Render
  // =========================
  //

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