// src/app/api/inspections/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { RiskLevel, FindingStatus } from "@prisma/client";

// ============================================================
// GET: جلب بيانات الفحص (مع النتائج والملاحظات)
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // جلب الفحص مع عناصر النموذج والنتائج والملاحظات المرتبطة
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
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    // تجميع البيانات حسب الفئة (categoryId) لعرضها منظم
    const categoriesMap = new Map();
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
      // إضافة البند مع نتيجته (افترضنا أن لكل بند نتيجة واحدة) مع تضمين findings
      const result = item.results?.[0] || null;
      categoriesMap.get(catId).items.push({
        id: item.id,
        itemId: item.itemId,
        code: item.itemCode,
        name: item.itemName,
        nameAr: item.itemNameAr,
        description: item.description,
        riskLevel: item.riskLevel,
        inputType: item.inputType,
        sortOrder: item.sortOrder,
        autoCreateWorkOrder: item.autoCreateWorkOrder,
        result,
      });
    });

    const categories = Array.from(categoriesMap.values());

    return NextResponse.json({
      ...inspection,
      categories,
    });
  } catch (error) {
    console.error("❌ Error fetching inspection:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT: تحديث بيانات الفحص (بما في ذلك النتائج والملاحظات)
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const {
      title,
      scheduledDate,
      status,
      notes,
      inspectorId,
      branchId,
      buildingId,
      floorId,
      roomId,
      results,
    } = body;

    // التحقق من وجود الفحص
    const existing = await prisma.inspection.findUnique({
      where: { id },
      select: { companyId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    // 1. تحديث بيانات الفحص الأساسية
    await prisma.inspection.update({
      where: { id },
      data: {
        title: title?.trim(),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        status,
        notes: notes || undefined,
        inspectorId: inspectorId || undefined,
        branchId: branchId || undefined,
        buildingId: buildingId || undefined,
        floorId: floorId || undefined,
        roomId: roomId || undefined,
      },
    });

    // 2. تحديث النتائج والملاحظات
    if (results && Array.isArray(results)) {
      for (const resultData of results) {
        const {
          inspectionFormItemId,
          result,
          notes: resultNotes,
          workOrderId,
          findings,
        } = resultData;

        if (!inspectionFormItemId) continue;

        // البحث عن النتيجة الحالية لهذا البند في هذا الفحص
        let existingResult = await prisma.inspectionResult.findFirst({
          where: {
            inspectionId: id,
            inspectionFormItemId: inspectionFormItemId,
          },
        });

        if (existingResult) {
          // تحديث النتيجة الموجودة
          await prisma.inspectionResult.update({
            where: { id: existingResult.id },
            data: {
              result,
              notes: resultNotes,
              workOrderId,
            },
          });
          // تحديث الملاحظات (findings) إذا تم إرسالها
          if (findings && Array.isArray(findings)) {
            // حذف الملاحظات القديمة
            await prisma.inspectionFinding.deleteMany({
              where: { inspectionResultId: existingResult.id },
            });
            // إضافة الملاحظات الجديدة (إن وجدت) مع التحقق من الحقول المطلوبة
            if (findings.length > 0) {
              const findingsData = findings.map((f: any) => ({
                inspectionResultId: existingResult.id,
                title: f.title || f.text || "ملاحظة تفتيش",
                description: f.description || f.text || null,
                riskLevel: (f.riskLevel as RiskLevel) || RiskLevel.medium,
                correctiveAction: f.correctiveAction || null,
                dueDate: f.dueDate ? new Date(f.dueDate) : null,
                status: f.status || FindingStatus.Open,
                createdById: f.createdById || null,
              }));
              await prisma.inspectionFinding.createMany({
                data: findingsData,
              });
            }
          }
        } else {
          // إنشاء نتيجة جديدة
          const newResult = await prisma.inspectionResult.create({
            data: {
              inspectionId: id,
              inspectionFormItemId: inspectionFormItemId,
              result,
              notes: resultNotes,
              workOrderId,
            },
          });
          // إضافة الملاحظات إن وجدت
          if (findings && Array.isArray(findings) && findings.length > 0) {
            const findingsData = findings.map((f: any) => ({
              inspectionResultId: newResult.id,
              title: f.title || f.text || "ملاحظة تفتيش",
              description: f.description || f.text || null,
              riskLevel: (f.riskLevel as RiskLevel) || RiskLevel.medium,
              correctiveAction: f.correctiveAction || null,
              dueDate: f.dueDate ? new Date(f.dueDate) : null,
              status: f.status || FindingStatus.Open,
              createdById: f.createdById || null,
            }));
            await prisma.inspectionFinding.createMany({
              data: findingsData,
            });
          }
        }
      }
    }

    // 3. جلب الفحص المحدث مع العلاقات الجديدة
    const fullInspection = await prisma.inspection.findUnique({
      where: { id },
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

    // إعادة تجميع البيانات بنفس هيكل GET
    const categoriesMap = new Map();
    fullInspection?.formItems.forEach((item) => {
      const catId = item.categoryId;
      if (!categoriesMap.has(catId)) {
        categoriesMap.set(catId, {
          categoryId: catId,
          categoryName: item.categoryName,
          categoryNameAr: item.categoryNameAr,
          items: [],
        });
      }
      const result = item.results?.[0] || null;
      categoriesMap.get(catId).items.push({
        id: item.id,
        itemId: item.itemId,
        code: item.itemCode,
        name: item.itemName,
        nameAr: item.itemNameAr,
        description: item.description,
        riskLevel: item.riskLevel,
        inputType: item.inputType,
        sortOrder: item.sortOrder,
        autoCreateWorkOrder: item.autoCreateWorkOrder,
        result,
      });
    });

    const categories = Array.from(categoriesMap.values());

    return NextResponse.json(
      {
        ...fullInspection,
        categories,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating inspection:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH (اختياري) – نفس منطق PUT
// ============================================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}