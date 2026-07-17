// src/app/[locale]/(dashboard)/work-orders/page.tsx
import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { WorkOrdersList } from "./WorkOrdersList";
import { WORK_ORDER_INCLUDE, mapWorkOrder } from "./helpers";

export default async function WorkOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; statusId?: string; priorityId?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { q, statusId, priorityId, page = "1" } = await searchParams;

  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");

  const companyId = session.companyId;
  if (!companyId) redirect("/login");

  const pageNum = parseInt(page, 10) || 1;
  const limit = 10;
  const skip = (pageNum - 1) * limit;

  const where: Prisma.WorkOrderWhereInput = {
    companyId,
    deletedAt: null,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
    ];
  }
  if (statusId && statusId !== "all") where.statusId = statusId;
  if (priorityId && priorityId !== "all") where.priorityId = priorityId;

  const [workOrdersRaw, total, statuses, priorities] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: WORK_ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.workOrder.count({ where }),
    prisma.workOrderStatus.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { order: "asc" },
    }).then((data) => data.map((s) => ({
      ...s,
      nameEn: s.nameEn ?? undefined,
      code: s.code ?? undefined,
    }))),
    prisma.workOrderPriority.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { order: "asc" },
    }).then((data) => data.map((p) => ({
      ...p,
      nameEn: p.nameEn ?? undefined,
    }))),
  ]);

  const transformedWorkOrders = workOrdersRaw.map(mapWorkOrder);

  const totalPages = Math.ceil(total / limit);

  return (
    <WorkOrdersList
      initialWorkOrders={transformedWorkOrders}
      statuses={statuses}
      priorities={priorities}
      total={total}
      currentPage={pageNum}
      totalPages={totalPages}
      q={q || ""}
      statusId={statusId || ""}
      priorityId={priorityId || ""}
      locale={locale}
    />
  );
}