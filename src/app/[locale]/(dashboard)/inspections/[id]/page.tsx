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

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      selectedCategories: {
        orderBy: { sortOrder: "asc" },
        include: {
          category: {
            include: {
              items: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      results: {
        include: { item: true },
      },
    },
  });

  if (!inspection) {
    redirect(`/${locale}/inspections`);
  }

  // بناء هيكل البيانات المنظم
  const resultsMap = new Map();
  inspection.results.forEach((r) => resultsMap.set(r.itemId, r));

  // ✅ تحويل null إلى undefined للحقول الاختيارية
  const categories = inspection.selectedCategories.map((sel) => ({
    categoryId: sel.categoryId,
    categoryName: sel.category.name,
    categoryNameAr: sel.category.nameAr ?? undefined, // ✅ تحويل null إلى undefined
    items: sel.category.items.map((item) => ({
      ...item,
      result: resultsMap.get(item.id) || null,
    })),
  }));

  const initialData = {
    id: inspection.id,
    title: inspection.title,
    locationName: inspection.locationName ?? undefined, // ✅ تحويل null إلى undefined
    scheduledDate: inspection.scheduledDate.toISOString(),
    status: inspection.status,
    categories,
    results: inspection.results.map((r) => ({
      id: r.id,
      itemId: r.itemId,
      result: r.result,
      notes: r.notes,
      imageUrl: r.imageUrl,
      workOrderId: r.workOrderId,
    })),
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