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

  // ✅ جلب الفحص مع العلاقات الجديدة (بدون locationName و imageUrl المباشر)
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
        include: {
          item: true,
          images: true, // ✅ جلب الصور المرتبطة
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

  // بناء هيكل البيانات المنظم
  const resultsMap = new Map();
  inspection.results.forEach((r) => resultsMap.set(r.itemId, r));

  // ✅ تحويل null إلى undefined للحقول الاختيارية
  const categories = inspection.selectedCategories.map((sel) => ({
    categoryId: sel.categoryId,
    categoryName: sel.category.name,
    categoryNameAr: sel.category.nameAr ?? undefined,
    items: sel.category.items.map((item) => ({
      ...item,
      result: resultsMap.get(item.id) || null,
    })),
  }));

  // ✅ بناء اسم الموقع من العلاقات الجديدة (بدلاً من locationName)
  const locationParts = [];
  if (inspection.branch) locationParts.push(inspection.branch.name);
  if (inspection.building) locationParts.push(inspection.building.name);
  if (inspection.floor) locationParts.push(inspection.floor.name);
  if (inspection.room) locationParts.push(inspection.room.name);

  const locationName = locationParts.length > 0 ? locationParts.join(" - ") : undefined;

  // ✅ تحويل النتائج مع الصور (بدون imageUrl المباشر)
  const results = inspection.results.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    result: r.result,
    notes: r.notes,
    workOrderId: r.workOrderId,
    // ✅ الصور موجودة في علاقة images
    images: r.images.map((img) => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
    })),
  }));

  const initialData = {
    id: inspection.id,
    title: inspection.title,
    locationName, // ✅ اسم الموقع المحسوب
    scheduledDate: inspection.scheduledDate.toISOString(),
    status: inspection.status,
    categories,
    results,
    // ✅ إضافة معرفات الموقع للاستخدام في المكونات
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