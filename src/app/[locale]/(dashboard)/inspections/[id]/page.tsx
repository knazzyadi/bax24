// src/app/[locale]/(dashboard)/inspections/[id]/page.tsx

import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { ClientWrapper } from "./ClientWrapper";
import type { InspectionData } from "../types";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Sparkles } from "lucide-react";

export default async function InspectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { locale, id } = await params;
  const { mode } = await searchParams || {};

  const session = await getAuthenticatedSession();
  if (!session) redirect("/login");

  const companyId = session.companyId;
  if (!companyId) redirect("/login");

  const initialEditMode = mode === "edit";

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      formItems: {
        orderBy: { sortOrder: "asc" },
        include: {
          results: {
            include: {
              findings: true,
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

  // تجميع formItems حسب categoryId
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
      id: item.id,
      itemId: item.itemId,
      code: item.itemCode,
      name: item.itemName,
      nameAr: item.itemNameAr,
      description: item.description,
      descriptionAr: item.descriptionAr,
      riskLevel: item.riskLevel,
      inputType: item.inputType,
      sortOrder: item.sortOrder,
      isRequired: item.isRequired,
      result: result
        ? {
            id: result.id,
            result: result.result,
            notes: result.notes,
            workOrderId: result.workOrderId,
            images: [],
            findings: result.findings,
            findingId: result.findings?.[0]?.id,
          }
        : null,
    });
  });

  const categories = Array.from(categoriesMap.values());

  // بناء اسم الموقع
  const locationParts = [];
  if (inspection.branch) locationParts.push(inspection.branch.name);
  if (inspection.building) locationParts.push(inspection.building.name);
  if (inspection.floor) locationParts.push(inspection.floor.name);
  if (inspection.room) locationParts.push(inspection.room.name);
  const locationName = locationParts.length > 0 ? locationParts.join(" - ") : undefined;

  // التحقق من وجود الفرع
  if (!inspection.branch) {
    throw new Error(`Inspection ${inspection.id} has no branch`);
  }

  // إعداد البيانات الأولية
  const initialData: InspectionData = {
    id: inspection.id,
    title: inspection.title,
    branchId: inspection.branchId,
    branch: {
      id: inspection.branch.id,
      name: inspection.branch.name,
      nameEn: inspection.branch.nameEn ?? undefined,
    },
    locationName,
    scheduledDate: inspection.scheduledDate.toISOString(),
    status: inspection.status,
    categories,
    buildingId: inspection.buildingId,
    floorId: inspection.floorId,
    roomId: inspection.roomId,
    createdAt: inspection.createdAt.toISOString(),
    updatedAt: inspection.updatedAt.toISOString(),
  };

  const isRtl = locale === "ar";

  return (
    <div className="container max-w-4xl py-4 sm:py-8 mx-auto">
      <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/10">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {isRtl ? "تفاصيل الفحص" : "Inspection Details"}
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm sm:text-base">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-400" />
                  {isRtl
                    ? `عرض تفاصيل الفحص: ${inspection.title}`
                    : `Viewing inspection: ${inspection.title}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </div>
        <ClientWrapper
          initialData={initialData}
          inspectionId={inspection.id}
          locale={locale}
          initialEditMode={initialEditMode}
        />
      </Card>
    </div>
  );
}