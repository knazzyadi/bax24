// src/app/[locale]/(dashboard)/work-orders/[id]/edit/page.tsx
import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { EditWorkOrderClient } from "./ClientWrapper";
import type { WorkOrderSource } from "../../types";

export default async function EditWorkOrderPage({
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
    where: {
      id,
      companyId,
      deletedAt: null,
    },
    include: {
      priority: { select: { id: true, name: true, nameEn: true, color: true } },
      status: { select: { id: true, name: true, nameEn: true, color: true } },
      branch: { select: { id: true, name: true, nameEn: true } },
      building: { select: { id: true, name: true, nameEn: true } },
      floor: { select: { id: true, name: true, nameEn: true } },
      room: { select: { id: true, name: true, nameEn: true } },
      assetType: { select: { id: true, name: true, nameEn: true } },
      workOrderType: {
        select: {
          id: true,
          name: true,
          nameEn: true,
        },
      },
      workOrderAssets: {
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              code: true,
            },
          },
        },
      },
      ticket: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
      attachments: {
        select: {
          id: true,
          url: true,
          fileName: true,
          originalName: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workOrder) {
    redirect(`/${locale}/work-orders`);
  }

  const [priorities, statuses, assetTypes, buildings, workOrderTypes] =
    await Promise.all([
      prisma.workOrderPriority.findMany({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            { isActive: true },
            ...(workOrder.priorityId ? [{ id: workOrder.priorityId }] : []),
          ],
        },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          nameEn: true,
          color: true,
        },
      }),
      prisma.workOrderStatus.findMany({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            { isActive: true },
            ...(workOrder.statusId ? [{ id: workOrder.statusId }] : []),
          ],
        },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          nameEn: true,
          color: true,
        },
      }),
      prisma.assetType.findMany({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            { isActive: true },
            ...(workOrder.assetTypeId ? [{ id: workOrder.assetTypeId }] : []),
          ],
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          name: true,
          nameEn: true,
          code: true,
        },
      }),
      prisma.building.findMany({
        where: {
          companyId,
          deletedAt: null,
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          nameEn: true,
          code: true,
        },
      }),
      prisma.workOrderType
        .findMany({
          where: {
            companyId,
            deletedAt: null,
            isActive: true,
          },
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            nameEn: true,
            code: true,
          },
        })
        .then((data) =>
          data.map((type) => ({
            ...type,
            nameEn: type.nameEn ?? undefined,
            code: type.code ?? undefined,
          }))
        ),
    ]);

  const buildingId = workOrder.building?.id ?? null;
  const floorId = workOrder.floor?.id ?? null;
  const roomId = workOrder.room?.id ?? null;

  const locationLevel = roomId
    ? "room"
    : floorId
    ? "floor"
    : buildingId
    ? "building"
    : "building";

  const rawSource = workOrder.sourceType ?? "manual";
  const source: WorkOrderSource =
    rawSource === "ticket" ||
    rawSource === "ppm" ||
    rawSource === "checklist" ||
    rawSource === "inspection_finding" ||
    rawSource === "manual"
      ? rawSource
      : "manual";

  const sourceId = workOrder.sourceId ?? null;

  const selectedAssets = workOrder.workOrderAssets.map((woa) => ({
    id: woa.asset.id,
    name: woa.asset.name,
    nameEn: woa.asset.nameEn,
    code: woa.asset.code,
  }));

  const initialData = {
    id: workOrder.id,
    title: workOrder.title,
    description: workOrder.description,
    workOrderTypeId: workOrder.workOrderTypeId ?? "",
    priorityId: workOrder.priorityId,
    statusId: workOrder.statusId,
    assetTypeId: workOrder.assetTypeId,
    notes: workOrder.notes,
    branchId: workOrder.branchId ?? "",
    buildingId: buildingId ?? "",
    floorId: floorId ?? "",
    roomId: roomId ?? "",
    locationLevel: locationLevel,
    assetIds: workOrder.workOrderAssets.map((woa) => woa.assetId),
    selectedAssets,
    source,
    sourceId,
    ticket: workOrder.ticket || null,
    attachments: workOrder.attachments || [],
  };

  return (
    <EditWorkOrderClient
      locale={locale}
      initialData={initialData}
      priorities={priorities}
      statuses={statuses}
      assetTypes={assetTypes}
      buildings={buildings}
      initialWorkOrderTypes={workOrderTypes}
    />
  );
}