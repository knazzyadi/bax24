import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { WorkOrderDetailClient } from "./ClientWrapper";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");

  const companyId = session.companyId;
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
      workOrderType: { select: { id: true, name: true, nameEn: true } },
      workOrderAssets: {
        include: {
          asset: { select: { id: true, name: true, nameEn: true, code: true } },
        },
      },
      ticket: { select: { id: true, title: true, description: true, code: true } },
      attachments: {
        select: { id: true, url: true, fileName: true, originalName: true, mimeType: true, size: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      createdByUser: { select: { id: true, name: true, email: true } },
      assignedUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!workOrder) redirect(`/${locale}/work-orders`);

  const statuses = (await prisma.workOrderStatus.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { order: "asc" },
  })).map(s => ({ ...s, nameEn: s.nameEn ?? undefined, color: s.color ?? undefined }));

  const priorities = (await prisma.workOrderPriority.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { order: "asc" },
  })).map(p => ({ ...p, nameEn: p.nameEn ?? undefined, color: p.color ?? undefined }));

  // ============================================================
  // ✅ تحديد المصدر بشكل صحيح
  // ============================================================
  let source: "manual" | "ticket" | "pm" | "checklist" = "manual";

  if (workOrder.sourceType === "MAINTENANCE_SCHEDULE" || workOrder.maintenanceScheduleId) {
    source = "pm";
  } else if (workOrder.sourceType === "INSPECTION_FINDING") {
    source = "checklist";
  } else if (workOrder.ticketId) {
    source = "ticket";
  } else {
    source = "manual";
  }

  // ============================================================
  // ترجمة المصدر حسب اللغة
  // ============================================================
  const sourceLabel = {
    pm: locale === "ar" ? "صيانة دورية" : "PPM",
    ticket: locale === "ar" ? "تذكرة" : "Ticket",
    checklist: locale === "ar" ? "فحص" : "Inspection",
    manual: locale === "ar" ? "يدوي" : "Manual",
  }[source];

  const initialData = {
    id: workOrder.id,
    code: workOrder.code ?? `WO-${workOrder.id.slice(-4)}`,
    title: workOrder.title,
    description: workOrder.description,
    type: workOrder.type,
    workOrderType: workOrder.workOrderType,
    priority: workOrder.priority ? { ...workOrder.priority, nameEn: workOrder.priority.nameEn ?? undefined, color: workOrder.priority.color ?? undefined } : null,
    status: workOrder.status ? { ...workOrder.status, nameEn: workOrder.status.nameEn ?? undefined, color: workOrder.status.color ?? undefined } : null,
    building: workOrder.building
      ? {
          ...workOrder.building,
          nameEn: workOrder.building.nameEn ?? undefined,
        }
      : null,
    floor: workOrder.floor
      ? {
          ...workOrder.floor,
          nameEn: workOrder.floor.nameEn ?? undefined,
        }
      : null,
    room: workOrder.room
      ? {
          ...workOrder.room,
          nameEn: workOrder.room.nameEn ?? undefined,
        }
      : null,
    branch: workOrder.branch
      ? {
          ...workOrder.branch,
          nameEn: workOrder.branch.nameEn ?? undefined,
        }
      : null,
    assetType: workOrder.assetType
      ? {
          ...workOrder.assetType,
          nameEn: workOrder.assetType.nameEn ?? undefined,
        }
      : null,
    notes: workOrder.notes,
    createdAt: workOrder.createdAt.toISOString(),
    updatedAt: workOrder.updatedAt.toISOString(),
    workOrderAssets: workOrder.workOrderAssets.map((woa) => ({
      assetId: woa.assetId,
      completedAt: woa.completedAt?.toISOString() || null,
      notes: woa.notes,
      asset: { ...woa.asset, nameEn: woa.asset.nameEn ?? undefined },
    })),
    ticketId: workOrder.ticket?.id || null,
    ticket: workOrder.ticket || null,
    attachments: workOrder.attachments || [],
    source,
    sourceLabel, // ✅ تمرير الترجمة
    sourceId: workOrder.sourceId || workOrder.ticketId || null,
    reason: workOrder.reason || null,
    createdBy: workOrder.createdByUser ? { id: workOrder.createdByUser.id, name: workOrder.createdByUser.name ?? "غير معروف", email: workOrder.createdByUser.email } : null,
    assignedTo: workOrder.assignedUser ? { id: workOrder.assignedUser.id, name: workOrder.assignedUser.name ?? "غير معروف", email: workOrder.assignedUser.email } : null,
  };

  return (
    <WorkOrderDetailClient
      initialData={initialData}
      canEdit={true}
      canDelete={true}
      locale={locale}
      statuses={statuses}
      priorities={priorities}
    />
  );
}