// src/app/[locale]/(dashboard)/inspections/[id]/print/page.tsx

import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import InspectionPrint from "./InspectionPrint";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Inspection Report",
  };
}

interface PrintItem {
  id: string;
  itemName: string;
  itemNameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  riskLevel?: string | null;
  correctiveAction?: string | null;
  result: {
    result: "pass" | "fail" | "na" | null;
    notes: string | null;
  } | null;
}

interface PrintCategory {
  categoryId: string;
  categoryName: string;
  categoryNameAr?: string | null;
  items: PrintItem[];
}

interface InspectionExtraFields {
  riskLevel?: string | null;
  correctiveAction?: string | null;
  recommendation?: string | null;
  dueDate?: Date | string | null;
}

export default async function InspectionPrintPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const session = await getAuthenticatedSession();

  if (!session) {
    redirect("/login");
  }

  const companyId = session.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const inspection = await prisma.inspection.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      formItems: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          results: true,
        },
      },
      branch: true,
      building: true,
      floor: true,
      room: true,
      inspector: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!inspection) {
    redirect(`/${locale}/inspections`);
  }

  const company = await prisma.company.findUnique({
    where: {
      id: companyId,
    },
    select: {
      name: true,
      nameEn: true,
    },
  });

  const categoriesMap = new Map<string, PrintCategory>();

  inspection.formItems.forEach((item) => {
    const categoryId = item.categoryId;

    if (!categoriesMap.has(categoryId)) {
      categoriesMap.set(categoryId, {
        categoryId,
        categoryName: item.categoryName,
        categoryNameAr: item.categoryNameAr,
        items: [],
      });
    }

    const result = item.results[0] ?? null;

    const itemExtra = item as typeof item & InspectionExtraFields;

    categoriesMap.get(categoryId)?.items.push({
      id: item.id,
      itemName: item.itemName,
      itemNameAr: item.itemNameAr,
      description: item.description,
      descriptionAr: item.descriptionAr,
      result: result
        ? {
            result: result.result as "pass" | "fail" | "na" | null,
            notes: result.notes,
          }
        : null,
      riskLevel: itemExtra.riskLevel ?? "low",
      correctiveAction: itemExtra.correctiveAction ?? "",
    });
  });

  const categories = Array.from(categoriesMap.values());

  const locationParts: string[] = [];

  if (inspection.branch) {
    locationParts.push(inspection.branch.name);
  }

  if (inspection.building) {
    locationParts.push(inspection.building.name);
  }

  if (inspection.floor) {
    locationParts.push(inspection.floor.name);
  }

  if (inspection.room) {
    locationParts.push(inspection.room.name);
  }

  const locationName = locationParts.join(" - ") || undefined;

  const inspectionExtra =
    inspection as typeof inspection & InspectionExtraFields;

  const data = {
    id: inspection.id,
    title: inspection.title,
    locationName,
    scheduledDate: inspection.scheduledDate.toISOString(),
    status: inspection.status,
    categories,
    inspector: inspection.inspector,
    company,
    recommendation: inspectionExtra.recommendation ?? "",
    dueDate: inspectionExtra.dueDate
      ? new Date(inspectionExtra.dueDate).toISOString()
      : null,
  };

  return (
    <InspectionPrint
      data={data}
      isRtl={locale === "ar"}
      locale={locale}
    />
  );
}