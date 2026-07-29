// src/app/[locale]/(dashboard)/inspections/[id]/page.tsx

import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { ClientWrapper } from "./ClientWrapper";

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");

  const companyId = session.companyId;
  if (!companyId) redirect("/login");

  // ✅ التعديل الأول: جلب findings مع النتائج
  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      formItems: {
        orderBy: { sortOrder: "asc" },
        include: {
          results: {
            include: {
              findings: true, // ✅ جلب الـ Findings المرتبطة بكل نتيجة
            },
          },
        },
      },
      branch: true,
      building: true,
      floor: true,
      room: true,
    },
  });

  if (!inspection) {
    redirect(`/${locale}/inspections`);
  }

  // ✅ تجميع formItems حسب categoryId
  const categoriesMap = new Map();
  inspection.formItems.forEach((item) => {
    const catId = item.categoryId;
    if (!categoriesMap.has(catId)) {
      categoriesMap.set(catId, {
        categoryId: catId,
        categoryName: item.categoryName,
        categoryNameAr: item.categoryNameAr ?? undefined,
        items: [],
      });
    }
    const result = item.results[0] || null;
    categoriesMap.get(catId).items.push({
      id: item.id, // inspectionFormItemId
      itemId: item.itemId, // للتتبع
      code: item.itemCode,
      name: item.itemName,
      nameAr: item.itemNameAr,
      description: item.description,
      descriptionAr: item.descriptionAr,
      riskLevel: item.riskLevel,
      inputType: item.inputType,
      sortOrder: item.sortOrder,
      isRequired: item.isRequired,
      // ✅ التعديل الثاني: إضافة findings و findingId
      result: result
        ? {
            id: result.id,
            result: result.result,
            notes: result.notes,
            workOrderId: result.workOrderId,
            images: [],
            findings: result.findings, // مصفوفة Findings كاملة
            findingId: result.findings?.[0]?.id, // أول Finding (إن وجد)
          }
        : null,
    });
  });

  const categories = Array.from(categoriesMap.values());

  // ✅ اسم الموقع
  const locationParts = [];
  if (inspection.branch) locationParts.push(inspection.branch.name);
  if (inspection.building) locationParts.push(inspection.building.name);
  if (inspection.floor) locationParts.push(inspection.floor.name);
  if (inspection.room) locationParts.push(inspection.room.name);
  const locationName = locationParts.length > 0 ? locationParts.join(" - ") : undefined;

  const initialData = {
    id: inspection.id,
    title: inspection.title,
    locationName,
    scheduledDate: inspection.scheduledDate.toISOString(),
    status: inspection.status,
    categories,
    branchId: inspection.branchId,
    buildingId: inspection.buildingId,
    floorId: inspection.floorId,
    roomId: inspection.roomId,
    createdAt: inspection.createdAt.toISOString(),
    updatedAt: inspection.updatedAt.toISOString(),
  };

  return (
    <ClientWrapper
      initialData={initialData}
      inspectionId={id}
      locale={locale}
    />
  );
}