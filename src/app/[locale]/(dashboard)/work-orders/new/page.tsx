// src/app/[locale]/(dashboard)/work-orders/new/page.tsx
import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { NewWorkOrderClient } from "./ClientWrapper";

export default async function NewWorkOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ 
    source?: string; 
    ticketId?: string; 
    pmPlanId?: string; 
    checklistId?: string;
  }>;
}) {
  const { locale } = await params;
  const { source, ticketId, pmPlanId, checklistId } = await searchParams;

  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");

  const companyId = session.companyId;
  if (!companyId) redirect("/login");

  // ✅ تحديد المصدر بناءً على المعطيات
  let initialSource: "manual" | "ticket" | "pm" | "checklist" = "manual";
  let initialSourceId: string | null = null;

  if (ticketId) {
    initialSource = "ticket";
    initialSourceId = ticketId;
  } else if (pmPlanId) {
    initialSource = "pm";
    initialSourceId = pmPlanId;
  } else if (checklistId) {
    initialSource = "checklist";
    initialSourceId = checklistId;
  } else if (source) {
    if (["ticket", "pm", "checklist", "manual"].includes(source)) {
      initialSource = source as any;
    }
  }

  // ✅ تحديد صلاحية التعديل (المدير فقط) – إصلاح session.user?.role
  const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";

  // ✅ جلب البيانات المطلوبة
  const [priorities, statuses, assetTypes, buildings, workOrderTypes] = await Promise.all([
    prisma.workOrderPriority.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, name: true, nameEn: true, color: true },
    }).then((data) => data.map((p) => ({
      ...p,
      nameEn: p.nameEn ?? undefined,
      color: p.color ?? undefined,
    }))),

    prisma.workOrderStatus.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, name: true, nameEn: true, color: true },
    }).then((data) => data.map((s) => ({
      ...s,
      nameEn: s.nameEn ?? undefined,
      color: s.color ?? undefined,
    }))),

    prisma.assetType.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, name: true, nameEn: true, code: true },
    }).then((data) => data.map((at) => ({
      ...at,
      nameEn: at.nameEn ?? undefined,
      code: at.code ?? undefined,
    }))),

    prisma.building.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, nameEn: true, code: true },
    }).then((data) => data.map((b) => ({
      ...b,
      nameEn: b.nameEn ?? undefined,
      code: b.code ?? undefined,
    }))),

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

  return (
    <NewWorkOrderClient
      locale={locale}
      session={session}
      initialPriorities={priorities}
      initialStatuses={statuses}
      initialAssetTypes={assetTypes}
      initialBuildings={buildings}
      initialWorkOrderTypes={workOrderTypes}
      initialSource={initialSource}
      initialSourceId={initialSourceId}
      isSourceEditable={isAdmin}
    />
  );
}