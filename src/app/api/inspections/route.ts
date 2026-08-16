// src/app/api/inspections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { ResultStatus } from "@prisma/client";

type InspectionGroup = {
  sectionId?: string;
  templateId?: string;
  categoryIds?: string[];
};

// ============================================================
// GET: جلب قائمة الفحوصات مع الإحصائيات وبيانات الفرع
// ============================================================
export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const inspections = await prisma.inspection.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        branch: true,
        formItems: {
          include: {
            results: true,
          },
        },
      },
    });

    const formatted = inspections.map((inspection) => ({
      ...inspection,
      _count: {
        totalItems: inspection.formItems.length,
        completedItems: inspection.formItems.filter((formItem) =>
          formItem.results.some(
            (result) => result.result !== ResultStatus.na
          )
        ).length,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching inspections:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: إنشاء فحص جديد مع نسخ البنود إلى InspectionFormItem
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!session.companyId) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      title,
      scheduledDate,
      branchId,
      items,
      sectionId,
      templateId,
      categoryIds,
      inspectorId,
      buildingId,
      floorId,
      roomId,
      notes,
    } = body as {
      title?: string;
      scheduledDate?: string;
      branchId?: string;
      items?: InspectionGroup[];
      sectionId?: string;
      templateId?: string;
      categoryIds?: string[];
      inspectorId?: string;
      buildingId?: string;
      floorId?: string;
      roomId?: string;
      notes?: string;
    };

    // التحقق من الحقول المطلوبة
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!branchId?.trim()) {
      return NextResponse.json(
        { error: "Branch is required" },
        { status: 400 }
      );
    }

    // ✅ التحقق من أن الفرع يتبع لنفس الشركة
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        companyId: session.companyId,
      },
      select: {
        id: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Invalid branch" },
        { status: 400 }
      );
    }

    // ============================================================
    // توحيد صيغة الطلب
    // ============================================================
    // الواجهة الجديدة ترسل:
    // sectionId + templateId + categoryIds
    //
    // بينما الـ API القديم كان يستقبل:
    // items: [{ sectionId, templateId, categoryIds }]
    //
    // نحول الصيغة الجديدة إلى الصيغة الداخلية الموحدة.
    // ============================================================

    const normalizedItems: InspectionGroup[] =
      Array.isArray(items) && items.length > 0
        ? items
        : sectionId || templateId || (Array.isArray(categoryIds) && categoryIds.length > 0)
          ? [
              {
                sectionId,
                templateId,
                categoryIds,
              },
            ]
          : [];

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "At least one group (section, template, category) is required",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 1. جمع معرفات الفئات (للاستخدام في جلب البنود)
    // ============================================================

    const categoryIdSet = new Set<string>();

    for (const group of normalizedItems) {
      const { sectionId, templateId, categoryIds } = group;

      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        const categories = await prisma.inspectionCategory.findMany({
          where: {
            id: {
              in: categoryIds,
            },
            companyId: session.companyId,
            deletedAt: null,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        categories.forEach((category) => {
          categoryIdSet.add(category.id);
        });
      } else if (templateId?.trim()) {
        const categories = await prisma.inspectionCategory.findMany({
          where: {
            templateId,
            companyId: session.companyId,
            deletedAt: null,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        categories.forEach((category) => {
          categoryIdSet.add(category.id);
        });
      } else if (sectionId?.trim()) {
        const templates = await prisma.inspectionTemplate.findMany({
          where: {
            sectionId,
            companyId: session.companyId,
            deletedAt: null,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        const templateIds = templates.map((template) => template.id);

        if (templateIds.length > 0) {
          const categories = await prisma.inspectionCategory.findMany({
            where: {
              templateId: {
                in: templateIds,
              },
              companyId: session.companyId,
              deletedAt: null,
              isActive: true,
            },
            select: {
              id: true,
            },
          });

          categories.forEach((category) => {
            categoryIdSet.add(category.id);
          });
        }
      }
    }

    const categoryIdsFinal = Array.from(categoryIdSet);

    if (categoryIdsFinal.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid categories found for the selected groups",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // 2. جلب الفئات والبنود
    // ============================================================

    const categoriesWithItems =
      await prisma.inspectionCategory.findMany({
        where: {
          id: {
            in: categoryIdsFinal,
          },
          companyId: session.companyId,
          deletedAt: null,
          isActive: true,
        },
        include: {
          template: {
            include: {
              section: true,
            },
          },
          items: {
            where: {
              isActive: true,
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });

    // ============================================================
    // 3. إنشاء الفحص مع branchId مطلوب
    // ============================================================

    const newInspection = await prisma.inspection.create({
      data: {
        companyId: session.companyId,
        title: title.trim(),
        scheduledDate: scheduledDate
          ? new Date(scheduledDate)
          : new Date(),
        branchId: branchId.trim(),
        inspectorId: inspectorId || null,
        buildingId: buildingId || null,
        floorId: floorId || null,
        roomId: roomId || null,
        notes: notes || null,
        status: "draft",
      },
    });

    // ============================================================
    // 3.5 ✅ حفظ الفئات المختارة مع الحفاظ على ترتيب المجموعات
    // ============================================================
    const selections = normalizedItems.flatMap((group, groupIndex) =>
      (group.categoryIds ?? []).map((categoryId) => ({
        inspectionId: newInspection.id,
        categoryId,
        sortOrder: groupIndex,
      }))
    );

    await prisma.inspectionCategorySelection.createMany({
      data: selections,
    });

    // ============================================================
    // 4. إنشاء Form Items
    // ============================================================

    const formItemsData = [];

    for (const category of categoriesWithItems) {
      for (const item of category.items) {
        formItemsData.push({
          inspectionId: newInspection.id,
          categoryId: category.id,
          itemId: item.id,
          categoryName: category.name,
          categoryNameAr: category.nameAr || null,
          itemCode: item.code || null,
          itemName: item.name,
          itemNameAr: item.nameAr || null,
          description: item.description || null,
          riskLevel: item.riskLevel || null,
          inputType: item.inputType || null,
          sortOrder: item.sortOrder || 0,
          autoCreateWorkOrder:
            item.autoCreateWorkOrder || false,
        });
      }
    }

    await prisma.inspectionFormItem.createMany({
      data: formItemsData,
    });

    // ============================================================
    // 5. جلب العناصر (Form Items) لإنشاء النتائج
    // ============================================================

    const createdFormItems =
      await prisma.inspectionFormItem.findMany({
        where: {
          inspectionId: newInspection.id,
        },
        select: {
          id: true,
        },
      });

    // ============================================================
    // 6. إنشاء النتائج (كلها NA مبدئياً)
    // ============================================================

    await prisma.inspectionResult.createMany({
      data: createdFormItems.map((formItem) => ({
        inspectionId: newInspection.id,
        inspectionFormItemId: formItem.id,
        result: ResultStatus.na,
      })),
    });

    // ============================================================
    // 7. إعادة البيانات مع تضمين الفرع والعلاقات
    // ============================================================

    const fullInspection = await prisma.inspection.findUnique({
      where: {
        id: newInspection.id,
      },
      include: {
        branch: true,
        formItems: {
          include: {
            results: {
              include: {
                findings: true,
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json(fullInspection, {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating inspection:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}