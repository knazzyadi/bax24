// src/app/[locale]/(dashboard)/work-orders/[id]/print/page.tsx
import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { WorkOrderPrint } from "./WorkOrderPrint";

// ✅ منع التخزين المؤقت وضمان تحديث البيانات
export const dynamic = 'force-dynamic';

export default async function WorkOrderPrintPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");

  const companyId = session.companyId;
  if (!companyId) redirect("/login");

  // جلب بيانات أمر العمل
  const workOrder = await prisma.workOrder.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      priority: true,
      status: true,
      branch: true,
      room: {
        include: {
          floor: {
            include: {
              building: true,
            },
          },
        },
      },
      assetType: true,
      workOrderAssets: {
        include: {
          asset: true,
        },
      },
      ticket: true,
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
      createdByUser: {
        select: { id: true, name: true, email: true },
      },
      assignedUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!workOrder) {
    redirect(`/${locale}/work-orders`);
  }

  // جلب بيانات الشركة (بدون شعار)
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, nameEn: true },
  });

  // تحديد المصدر
  let source: "manual" | "ticket" | "pm" | "checklist" = "manual";
  if (workOrder.ticketId) {
    source = "ticket";
  }

  const initialData = {
    id: workOrder.id,
    code: workOrder.code ?? `WO-${workOrder.id.slice(-4)}`,
    title: workOrder.title,
    description: workOrder.description,
    type: workOrder.type,
    priority: workOrder.priority,
    status: workOrder.status,
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
  };

  return (
    <WorkOrderPrint
      data={initialData}
      isRtl={locale === "ar"}
      locale={locale}
    />
  );
}