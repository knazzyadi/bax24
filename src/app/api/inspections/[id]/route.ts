// src/app/api/inspections/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { ResultStatus, InspectionStatus, Prisma } from "@prisma/client";

// ============================================================
// النوع الخاص بتحديث النتائج
// ============================================================
type ResultUpdatePayload = {
  inspectionFormItemId: string;
  result: ResultStatus;
  notes?: string;
  findings?: {
    title: string;
    description?: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    correctiveAction?: string;
    dueDate?: string | null;
  }[];
};

type InspectionGroupResponse = {
  id: string;
  sectionId: string;
  templateId: string;
  categoryIds: string[];
};

// ============================================================
// نوع فئات الفحص المُجمَّعة (لـ API)
// ============================================================
type InspectionCategoryResponse = {
  categoryId: string;
  categoryName: string;
  categoryNameAr?: string;
  items: {
    id: string;
    itemId: string | null;
    code: string | null;
    name: string;
    nameAr: string | null;
    description: string | null;
    descriptionAr?: string | null;
    riskLevel: string | null;
    inputType: string | null;
    sortOrder: number;
    isRequired: boolean;
    result: {
      id: string;
      result: ResultStatus;
      notes: string | null;
      workOrderId: string | null;
      images: [];
      findings: unknown[];
      findingId?: string;
    } | null;
  }[];
};

// ============================================================
// دالة بناء الفئات من formItems
// ============================================================
function buildCategories(
  formItems: Prisma.InspectionFormItemGetPayload<{
    include: { results: { include: { findings: true } } };
  }>[]
): InspectionCategoryResponse[] {
  const categoriesMap = new Map<string, InspectionCategoryResponse>();

  for (const item of formItems) {
    const categoryId = item.categoryId;

    if (!categoriesMap.has(categoryId)) {
      categoriesMap.set(categoryId, {
        categoryId,
        categoryName: item.categoryName,
        categoryNameAr: item.categoryNameAr ?? undefined,
        items: [],
      });
    }

    const result = item.results?.[0] ?? null;

    categoriesMap.get(categoryId)!.items.push({
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
            findings: result.findings ?? [],
            findingId: result.findings?.[0]?.id,
          }
        : null,
    });
  }

  return Array.from(categoriesMap.values());
}

// ============================================================
// GET: جلب بيانات فحص
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 401 });
    }

    const companyId = session.companyId;
    const { id } = await params;

    const inspection = await prisma.inspection.findUnique({
      where: { id, companyId, deletedAt: null },
      include: {
        branch: true,
        selectedCategories: {
          include: { category: { include: { template: true } } },
          orderBy: { sortOrder: "asc" },
        },
        formItems: {
          orderBy: { sortOrder: "asc" },
          include: { results: { include: { findings: true } } },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    // تجميع الفئات حسب (sectionId, templateId)
    const groupMap = new Map<string, InspectionGroupResponse>();
    inspection.selectedCategories.forEach((selection) => {
      const sectionId = selection.category.template.sectionId;
      const templateId = selection.category.templateId;
      const key = `${sectionId}-${templateId}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: crypto.randomUUID(),
          sectionId,
          templateId,
          categoryIds: [],
        });
      }
      groupMap.get(key)!.categoryIds.push(selection.categoryId);
    });

    const items = Array.from(groupMap.values());
    const categories = buildCategories(inspection.formItems);

    return NextResponse.json({
      ...inspection,
      items,
      categories,
    });
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ============================================================
// PUT: تحديث نتائج الفحص وحالته فقط
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 401 });
    }

    const companyId = session.companyId;
    const { id } = await params;

    const existing = await prisma.inspection.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    const body = await req.json();

    if (!body.results || !Array.isArray(body.results)) {
      return NextResponse.json(
        { error: "Only inspection results can be updated" },
        { status: 400 }
      );
    }

    return await handleResultsUpdate(id, body.results, body.status, companyId);
  } catch (error) {
    console.error("Error updating inspection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ============================================================
// دالة مساعدة: تحديث النتائج فقط (بدون حذف البنود)
// ============================================================
async function handleResultsUpdate(
  inspectionId: string,
  results: ResultUpdatePayload[],
  newStatus: string | undefined,
  companyId: string
) {
  const inspection = await prisma.inspection.findFirst({
    where: { id: inspectionId, companyId, deletedAt: null },
    select: { id: true },
  });
  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  for (const resultData of results) {
    const { inspectionFormItemId, result, notes, findings } = resultData;

    if (!inspectionFormItemId) continue;

    const formItem = await prisma.inspectionFormItem.findFirst({
      where: { id: inspectionFormItemId, inspectionId },
    });
    if (!formItem) continue;

    const existingResult = await prisma.inspectionResult.findFirst({
      where: { inspectionId, inspectionFormItemId },
    });

    let updatedResult;
    if (existingResult) {
      updatedResult = await prisma.inspectionResult.update({
        where: { id: existingResult.id },
        data: {
          result,
          notes: notes || null,
        },
      });
    } else {
      updatedResult = await prisma.inspectionResult.create({
        data: {
          inspectionId,
          inspectionFormItemId,
          result,
          notes: notes || null,
        },
      });
    }

    if (findings && Array.isArray(findings)) {
      await prisma.inspectionFinding.deleteMany({
        where: { inspectionResultId: updatedResult.id },
      });

      for (const finding of findings) {
        await prisma.inspectionFinding.create({
          data: {
            inspectionResultId: updatedResult.id,
            title: finding.title,
            description: finding.description || null,
            riskLevel: finding.riskLevel,
            correctiveAction: finding.correctiveAction || null,
            dueDate: finding.dueDate ? new Date(finding.dueDate) : null,
          },
        });
      }
    }
  }

  // تحديث حالة الفحص باستخدام قيم الـ enum الصحيحة
  if (newStatus) {
    const validStatuses: InspectionStatus[] = [
      InspectionStatus.draft,
      InspectionStatus.in_progress,
      InspectionStatus.completed,
      InspectionStatus.approved,
      InspectionStatus.cancelled,
    ];

    if (validStatuses.includes(newStatus as InspectionStatus)) {
      await prisma.inspection.update({
        where: { id: inspectionId },
        data: { status: newStatus as InspectionStatus },
      });
    } else {
      console.warn(
        `Invalid status received: ${newStatus}, skipping status update.`
      );
    }
  }

  const updatedInspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: {
      branch: true,
      selectedCategories: {
        include: { category: { include: { template: true } } },
        orderBy: { sortOrder: "asc" },
      },
      formItems: {
        orderBy: { sortOrder: "asc" },
        include: { results: { include: { findings: true } } },
      },
    },
  });

  const categories = buildCategories(updatedInspection?.formItems ?? []);

  return NextResponse.json({
    ...updatedInspection,
    categories,
  });
}