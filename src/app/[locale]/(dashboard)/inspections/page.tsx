// src/app/[locale]/(dashboard)/inspections/page.tsx

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import InspectionsClient from "./InspectionsClient";
import type { Inspection } from "./types";
import { Prisma, InspectionStatus, ResultStatus } from "@prisma/client";

export default async function InspectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const paramsResolved = await params;
  const searchParamsResolved = await searchParams;

  let session;

  try {
    session = await getAuthenticatedSession();
  } catch {
    redirect("/login");
  }

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
    redirect("/login");
  }

  const { locale } = paramsResolved;

  const {
    q,
    status,
    page = "1",
    limit = "10",
  } = searchParamsResolved;

  const companyId = session.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.InspectionWhereInput = {
    deletedAt: null,
    companyId,
  };

  // البحث
  if (q?.trim()) {
    where.OR = [
      {
        title: {
          contains: q.trim(),
          mode: "insensitive",
        },
      },
    ];
  }

  // الفلترة بالحالة
  if (status && status !== "all") {
    if (
      Object.values(InspectionStatus).includes(
        status as InspectionStatus
      )
    ) {
      where.status = status as InspectionStatus;
    }
  }

  // ============================================================
  // 1. جلب الفحوصات المطلوبة فقط
  // ============================================================

  const [inspections, totalCount] = await Promise.all([
    prisma.inspection.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limitNum,

      select: {
        id: true,
        title: true,
        branchId: true,
        scheduledDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        branch: {
          select: {
            id: true,
            name: true,
            nameEn: true,
          },
        },

        formItems: {
          select: {
            id: true,
          },
        },
      },
    }),

    prisma.inspection.count({
      where,
    }),
  ]);

  // ============================================================
  // 2. جلب نتائج الفحوصات الحالية فقط
  //
  // لا نجلب notes / score / images / findings...
  // نحتاج فقط inspectionId و result
  // ============================================================

  const inspectionIds = inspections.map(
    (inspection) => inspection.id
  );

  const resultCounts =
    inspectionIds.length > 0
      ? await prisma.inspectionResult.groupBy({
          by: ["inspectionId", "result"],
          where: {
            inspectionId: {
              in: inspectionIds,
            },
          },
          _count: {
            _all: true,
          },
        })
      : [];

  // ============================================================
  // 3. تحويل النتائج إلى Map
  // ============================================================

  const resultCountMap = new Map<
    string,
    {
      completedItems: number;
    }
  >();

  for (const row of resultCounts) {
    if (row.result === ResultStatus.na) {
      continue;
    }

    const current = resultCountMap.get(row.inspectionId);

    resultCountMap.set(row.inspectionId, {
      completedItems:
        (current?.completedItems ?? 0) + row._count._all,
    });
  }

  // ============================================================
  // 4. تحويل البيانات إلى النوع المستخدم في Client
  // ============================================================

  const transformedInspections: Inspection[] = inspections.map(
    (ins) => {
      const resultCount = resultCountMap.get(ins.id);

      return {
        id: ins.id,
        title: ins.title,

        branchId: ins.branchId,

        branch: {
          id: ins.branch.id,
          name: ins.branch.name,
          nameEn: ins.branch.nameEn ?? undefined,
        },

        locationName: undefined,

        scheduledDate: ins.scheduledDate.toISOString(),

        inspectorName: undefined,

        status: ins.status,

        inspectorSignature: undefined,
        supervisorSignature: undefined,

        createdAt: ins.createdAt.toISOString(),
        updatedAt: ins.updatedAt.toISOString(),

        _count: {
          totalItems: ins.formItems.length,
          completedItems: resultCount?.completedItems ?? 0,
        },
      };
    }
  );

  // ============================================================
  // 5. الحالات
  // ============================================================

  const statuses = [
    {
      id: "all",
      name: "الكل",
      nameEn: "All",
    },
    {
      id: "draft",
      name: "مسودة",
      nameEn: "Draft",
    },
    {
      id: "in_progress",
      name: "قيد التنفيذ",
      nameEn: "In Progress",
    },
    {
      id: "completed",
      name: "مكتمل",
      nameEn: "Completed",
    },
    {
      id: "approved",
      name: "معتمد",
      nameEn: "Approved",
    },
    {
      id: "cancelled",
      name: "ملغي",
      nameEn: "Cancelled",
    },
  ];

  // ============================================================
  // 6. Pagination
  // ============================================================

  const baseUrl = `/${locale}/inspections`;
  const queryParams = new URLSearchParams();
  if (q) {
    queryParams.set("q", q);
  }
  if (status && status !== "all") {
    queryParams.set("status", status);
  }
  if (limit) {
    queryParams.set("limit", limit);
  }
  const totalPages = Math.ceil(totalCount / limitNum);
  const nextUrl =
    pageNum < totalPages
      ? `${baseUrl}?${queryParams.toString()}&page=${
          pageNum + 1
        }`
      : null;
  const prevUrl =
    pageNum > 1
      ? `${baseUrl}?${queryParams.toString()}&page=${
          pageNum - 1
        }`
      : null;

  // ============================================================
  // 7. العرض
  // ============================================================

  return (
    <InspectionsClient
      initialInspections={transformedInspections}
      statuses={statuses}
      q={q || ""}
      statusFilter={status || ""}
      locale={locale}
      pagination={{
        hasMore: pageNum < totalPages,
        nextUrl,
        prevUrl,
        currentCount: inspections.length,
        totalCount,
        startIndex: totalCount > 0 ? skip + 1 : 0,
        currentPage: pageNum,
        totalPages,
      }}
    />
  );
}