// src/app/api/inspections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { ResultStatus } from "@prisma/client";

// ============================================================
// GET: جلب قائمة الفحوصات مع الإحصائيات
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        formItems: {
          include: {
            results: {
              include: {},
            },
          },
        },
      },
    });

    const formatted = inspections.map((ins) => ({
      ...ins,
      _count: {
        totalItems: ins.formItems.length,
        completedItems: ins.formItems.filter((fi) =>
          fi.results.some((r) => r.result !== "na")
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      items, // [{ sectionId, templateId, categoryId }]
      inspectorId,
      branchId,
      buildingId,
      floorId,
      roomId,
      notes,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one group (section, template, category) is required" },
        { status: 400 }
      );
    }

    // ============================================================
    // 1. جمع معرفات الفئات من المجموعات
    // ============================================================
    const categoryIdSet = new Set<string>();
    for (const group of items) {
      const { sectionId, templateId, categoryId } = group;
      if (categoryId && categoryId.trim() !== "") {
        const category = await prisma.inspectionCategory.findFirst({
          where: {
            id: categoryId,
            companyId: session.companyId,
            deletedAt: null,
            isActive: true,
          },
          select: { id: true },
        });
        if (category) categoryIdSet.add(category.id);
      } else if (templateId && templateId.trim() !== "") {
        const categories = await prisma.inspectionCategory.findMany({
          where: {
            templateId: templateId,
            companyId: session.companyId,
            deletedAt: null,
            isActive: true,
          },
          select: { id: true },
        });
        categories.forEach((c) => categoryIdSet.add(c.id));
      } else if (sectionId && sectionId.trim() !== "") {
        const templates = await prisma.inspectionTemplate.findMany({
          where: {
            sectionId: sectionId,
            companyId: session.companyId,
            deletedAt: null,
            isActive: true,
          },
          select: { id: true },
        });
        const templateIds = templates.map((t) => t.id);
        if (templateIds.length > 0) {
          const categories = await prisma.inspectionCategory.findMany({
            where: {
              templateId: { in: templateIds },
              companyId: session.companyId,
              deletedAt: null,
              isActive: true,
            },
            select: { id: true },
          });
          categories.forEach((c) => categoryIdSet.add(c.id));
        }
      }
    }

    const categoryIds = Array.from(categoryIdSet);
    if (categoryIds.length === 0) {
      return NextResponse.json(
        { error: "No valid categories found for the selected groups" },
        { status: 404 }
      );
    }

    // ============================================================
    // 2. جلب البنود مع بيانات الفئات
    // ============================================================
    const categoriesWithItems = await prisma.inspectionCategory.findMany({
      where: {
        id: { in: categoryIds },
        companyId: session.companyId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        template: {
          include: { section: true },
        },
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // ============================================================
    // 3. إنشاء الفحص
    // ============================================================
    const newInspection = await prisma.inspection.create({
      data: {
        companyId: session.companyId,
        title: title.trim(),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        inspectorId: inspectorId || null,
        branchId: branchId || null,
        buildingId: buildingId || null,
        floorId: floorId || null,
        roomId: roomId || null,
        notes: notes || null,
        status: "draft",
      },
    });

    // ============================================================
    // 4. نسخ البنود إلى InspectionFormItem
    // ============================================================
    const formItemsData = [];
    for (const cat of categoriesWithItems) {
      for (const item of cat.items) {
        formItemsData.push({
          inspectionId: newInspection.id,
          categoryId: cat.id,
          itemId: item.id,
          categoryName: cat.name,
          categoryNameAr: cat.nameAr || null,
          itemCode: item.code || null,
          itemName: item.name,
          itemNameAr: item.nameAr || null,
          description: item.description || null,
          // ✅ تم إزالة descriptionAr لأنه غير موجود في InspectionItem
          riskLevel: item.riskLevel || null,
          inputType: item.inputType || null,
          sortOrder: item.sortOrder || 0,
          autoCreateWorkOrder: item.autoCreateWorkOrder || false,
          // ✅ تم إزالة isRequired لأنه غير موجود في InspectionItem
        });
      }
    }

    await prisma.inspectionFormItem.createMany({
      data: formItemsData,
    });

    // ============================================================
    // 5. جلب الـ formItems المنشأة حديثاً لإنشاء النتائج
    // ============================================================
    const createdFormItems = await prisma.inspectionFormItem.findMany({
      where: { inspectionId: newInspection.id },
      select: { id: true },
    });

    // ============================================================
    // 6. إنشاء النتائج لكل بند (الحالة الافتراضية: na)
    // ============================================================
    await prisma.inspectionResult.createMany({
      data: createdFormItems.map((fi) => ({
        inspectionId: newInspection.id,
        inspectionFormItemId: fi.id,
        result: ResultStatus.na,
      })),
    });

    // ============================================================
    // 7. إعادة الفحص مع formItems ونتائجها (مع findings)
    // ============================================================
    const fullInspection = await prisma.inspection.findUnique({
      where: { id: newInspection.id },
      include: {
        formItems: {
          include: {
            results: {
              include: {
                findings: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(fullInspection, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}