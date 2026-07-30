// src/app/[locale]/(dashboard)/inspections/[id]/print/page.tsx
import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import InspectionPrint from "./InspectionPrint";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: "Inspection Report",
  };
}

export default async function InspectionPrintPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");

  const companyId = session.companyId!;
  if (!companyId) redirect("/login");

  // جلب بيانات الفحص مع الحقول الجديدة (بدون صور)
  const inspection = await prisma.inspection.findFirst({
    where: { id, companyId },
    include: {
      formItems: {
        orderBy: { sortOrder: "asc" },
        include: {
          results: true,          // النتائج (pass/fail/na)
        },
      },
      branch: true,
      building: true,
      floor: true,
      room: true,
      inspector: {
        select: { id: true, name: true, email: true },
      },
      // لا يتم جلب أي صور
    },
  });

  if (!inspection) {
    redirect(`/${locale}/inspections`);
  }

  // جلب بيانات الشركة
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true, nameEn: true },
  });

  // تجميع البنود حسب الفئة
  const categoriesMap = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      categoryNameAr?: string | null;
      items: any[];
    }
  >();

  inspection.formItems.forEach((item) => {
    const catId = item.categoryId;
    if (!categoriesMap.has(catId)) {
      categoriesMap.set(catId, {
        categoryId: catId,
        categoryName: item.categoryName,
        categoryNameAr: item.categoryNameAr,
        items: [],
      });
    }
    const result = item.results[0] || null;
    // استخراج الحقول الجديدة من item (مع قيم افتراضية)
    const riskLevel = (item as any).riskLevel || "low";
    const correctiveAction = (item as any).correctiveAction || "";

    categoriesMap.get(catId)!.items.push({
      id: item.id,
      itemName: item.itemName,
      itemNameAr: item.itemNameAr,
      description: item.description,
      descriptionAr: item.descriptionAr,
      result: result
        ? {
            result: result.result,
            notes: result.notes,
          }
        : null,
      // الحقول الجديدة
      riskLevel,
      correctiveAction,
    });
  });

  const categories = Array.from(categoriesMap.values());

  // بناء موقع التقرير
  const locationParts = [];
  if (inspection.branch) locationParts.push(inspection.branch.name);
  if (inspection.building) locationParts.push(inspection.building.name);
  if (inspection.floor) locationParts.push(inspection.floor.name);
  if (inspection.room) locationParts.push(inspection.room.name);
  const locationName = locationParts.join(" - ") || undefined;

  // تجهيز البيانات النهائية (بدون صور)
  const data = {
    id: inspection.id,
    title: inspection.title,
    locationName,
    scheduledDate: inspection.scheduledDate.toISOString(),
    status: inspection.status,
    categories,
    inspector: inspection.inspector,
    company,
    // الحقول الجديدة على مستوى التقرير
    recommendation: (inspection as any).recommendation || "",
    dueDate: (inspection as any).dueDate
      ? new Date((inspection as any).dueDate).toISOString()
      : null,
  };

  return <InspectionPrint data={data} isRtl={locale === "ar"} locale={locale} />;
}