// src/app/[locale]/(dashboard)/work-orders/[id]/print/page.tsx
import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { WorkOrderPrint } from "./WorkOrderPrint";

export const dynamic = 'force-dynamic';

export default async function WorkOrderPrintPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");

  const companyId = session.companyId!;
  if (!companyId) redirect("/login");

  const workOrder = await prisma.workOrder.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      priority: { select: { id: true, name: true, nameEn: true, color: true, code: true } },
      status: { select: { id: true, name: true, nameEn: true, color: true, code: true } },
      branch: { select: { id: true, name: true, nameEn: true } },
      building: { select: { id: true, name: true, nameEn: true } },
      floor: { select: { id: true, name: true, nameEn: true } },
      room: { select: { id: true, name: true, nameEn: true } },
      assetType: { select: { id: true, name: true, nameEn: true } },
      workOrderAssets: { include: { asset: { select: { id: true, name: true, nameEn: true, code: true } } } },
      ticket: { select: { id: true, title: true, description: true, code: true } },
      attachments: { select: { id: true, url: true, fileName: true, originalName: true, mimeType: true, size: true, createdAt: true } },
      createdByUser: { select: { id: true, name: true, email: true } },
      assignedUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!workOrder) redirect(`/${locale}/work-orders`);

  const auditLogsRaw = await prisma.auditLog.findMany({
    where: { entityType: 'workOrder', entityId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const userIds = auditLogsRaw.map(log => log.userId).filter((id): id is string => id !== null);
  let usersMap: Record<string, { id: string; name: string; email: string }> = {};
  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    usersMap = users.reduce((acc, user) => {
      acc[user.id] = { id: user.id, name: user.name ?? '', email: user.email };
      return acc;
    }, {} as Record<string, { id: string; name: string; email: string }>);
  }

  const auditLogs = auditLogsRaw.map((log) => ({
    id: log.id,
    action: log.action,
    createdAt: log.createdAt.toISOString(),
    user: log.userId ? (usersMap[log.userId] || { id: log.userId, name: log.userEmail || log.userId, email: log.userEmail || '' }) : null,
    details: log.changes || log.metadata || null,
  }));

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, nameEn: true },
  });

  const source: "manual" | "ticket" | "pm" | "checklist" = workOrder.ticketId ? "ticket" : "manual";

  const initialData = {
    id: workOrder.id,
    code: workOrder.code ?? `WO-${workOrder.id.slice(-4)}`,
    title: workOrder.title,
    description: workOrder.description,
    type: workOrder.type,
    priority: workOrder.priority,
    status: workOrder.status,
    building: workOrder.building,
    floor: workOrder.floor,
    room: workOrder.room,
    branch: workOrder.branch,
    assetType: workOrder.assetType,
    notes: workOrder.notes,
    createdAt: workOrder.createdAt.toISOString(),
    updatedAt: workOrder.updatedAt.toISOString(),
    workOrderAssets: workOrder.workOrderAssets.map((woa) => ({
      assetId: woa.assetId,
      completedAt: woa.completedAt?.toISOString() || null,
      notes: woa.notes,
      asset: woa.asset,
    })),
    ticketId: workOrder.ticket?.id || null,
    attachments: workOrder.attachments || [],
    source,
    sourceId: workOrder.ticketId || null,
    reason: workOrder.reason || null,
    createdBy: workOrder.createdByUser,
    assignedTo: workOrder.assignedUser,
    company,
    auditLogs,
  };

  return <WorkOrderPrint data={initialData} isRtl={locale === "ar"} locale={locale} />;
}