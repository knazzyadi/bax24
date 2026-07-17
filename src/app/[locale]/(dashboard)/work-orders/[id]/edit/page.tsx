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

  // جلب بيانات أمر العمل مع المرفقات والتذكرة المرتبطة
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
      // ✅ جلب التذكرة المرتبطة (إن وجدت)
      ticket: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
      // ✅ جلب المرفقات
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
  const [priorities, statuses, assetTypes, buildings, workOrderTypes] = await Promise.all([
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
    prisma.workOrderType.findMany({
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
    }).then((data) => data.map((type) => ({
      ...type,
      nameEn: type.nameEn ?? undefined,
      code: type.code ?? undefined,
    }))),
  ]);

  // استنتاج floorId و buildingId من room
  const floorId = workOrder.room?.floor?.id ?? null;
  const buildingId = workOrder.room?.floor?.building?.id ?? null;

  // تحديد مستوى الموقع بناءً على البيانات المتاحة
  const locationLevel = workOrder.roomId
    ? "room"
    : floorId
    ? "floor"
    : buildingId
    ? "building"
    : "building";

  // ✅ تحديد المصدر بناءً على وجود تذكرة مرتبطة
  let source: "manual" | "ticket" | "pm" | "checklist" = "manual";
  if (workOrder.ticketId) {
    source = "ticket";
  }
  // يمكن لاحقاً إضافة منطق لتحديد المصدر من PM أو Checklist إذا كانت موجودة في قاعدة البيانات

  // ✅ تحويل بيانات أمر العمل إلى صيغة مناسبة
  const initialData = {
    id: workOrder.id,
    title: workOrder.title,
    description: workOrder.description,
    type: workOrder.type,
    priorityId: workOrder.priorityId,
    statusId: workOrder.statusId,
    assetTypeId: workOrder.assetTypeId,
    notes: workOrder.notes,
    branchId: workOrder.branchId,
    buildingId,
    floorId,
    roomId: workOrder.room?.id ?? null,
    assetIds: workOrder.workOrderAssets.map((woa) => woa.assetId),
    locationLevel,
    // ✅ إضافة الحقول الجديدة
    source,
    sourceId: workOrder.ticketId || null,
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