// src/app/[locale]/(dashboard)/work-orders/[id]/edit/page.tsx
import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { EditWorkOrderClient } from "./ClientWrapper";

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

  // جلب بيانات أمر العمل مع جميع العلاقات
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
      room: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          floor: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              building: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  branchId: true,
                },
              },
            },
          },
        },
      },
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

  // جلب البيانات الأولية للنموذج
  const [priorities, statuses, assetTypes, buildings, workOrderTypes] =
    await Promise.all([
      prisma.workOrderPriority.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { order: "asc" },
        select: { id: true, name: true, nameEn: true, color: true },
      }),
      prisma.workOrderStatus.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { order: "asc" },
        select: { id: true, name: true, nameEn: true, color: true },
      }),
      prisma.assetType.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { order: "asc" },
        select: { id: true, name: true, nameEn: true, code: true },
      }),
      prisma.building.findMany({
        where: { companyId, deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true, nameEn: true, code: true },
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

  const floorId = workOrder.room?.floor?.id ?? null;
  const buildingId = workOrder.room?.floor?.building?.id ?? null;

  const locationLevel = workOrder.roomId
    ? "room"
    : floorId
    ? "floor"
    : buildingId
    ? "building"
    : "building";

  // ✅ المشكلة الأولى: استخدم sourceType من قاعدة البيانات بدلاً من الاعتماد على ticketId
  const source = workOrder.sourceType ?? "manual";
  const sourceId = workOrder.sourceId ?? null;

  // ✅ المشكلة الثانية: الأصول المختارة مع بياناتها الكاملة
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
    assetTypeId: workOrder.assetTypeId, // ✅ assetTypeId موجود
    notes: workOrder.notes,
    branchId: workOrder.branchId,
    buildingId,
    floorId,
    roomId: workOrder.room?.id ?? null,
    assetIds: workOrder.workOrderAssets.map((woa) => woa.assetId),
    selectedAssets, // ✅ الأصول الكاملة
    locationLevel,
    source, // ✅ المصدر الصحيح
    sourceId, // ✅ معرف المصدر الصحيح
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