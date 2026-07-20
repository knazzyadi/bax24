// src/app/api/inspections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
// ✅ استيراد الـ enum من Prisma
import { ResultStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        selectedCategories: {
          include: { category: true }
        },
        results: true
      }
    });

    const formatted = inspections.map(ins => ({
      ...ins,
      _count: {
        totalItems: ins.results.length,
        completedItems: ins.results.filter(r => r.result !== 'na').length
      }
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, locationName, scheduledDate, categoryIds, inspectorName } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: "At least one category is required" }, { status: 400 });
    }

    // 1️⃣ إنشاء الفحص مع العناوين المختارة
    const newInspection = await prisma.inspection.create({
      data: {
        title: title.trim(),
        locationName: locationName?.trim() || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        inspectorName: inspectorName?.trim() || null,
        status: 'draft',
        selectedCategories: {
          create: categoryIds.map((catId: string, index: number) => ({
            categoryId: catId,
            sortOrder: index
          }))
        }
      },
      include: {
        selectedCategories: {
          include: { category: true }
        }
      }
    });

    // 2️⃣ جلب جميع البنود النشطة للعناوين المختارة
    const categoriesWithItems = await prisma.inspectionCategory.findMany({
      where: { id: { in: categoryIds } },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    // 3️⃣ إنشاء النتائج لكل بند باستخدام الـ enum
    const itemsToCreate = [];
    for (const category of categoriesWithItems) {
      for (const item of category.items) {
        itemsToCreate.push({
          inspectionId: newInspection.id,
          itemId: item.id,
          result: ResultStatus.na, // ✅ استخدام الـ enum مباشرة
        });
      }
    }

    if (itemsToCreate.length > 0) {
      await prisma.inspectionResult.createMany({
        data: itemsToCreate
      });
    }

    // 4️⃣ إعادة الفحص مع البيانات المحدثة
    const updatedInspection = await prisma.inspection.findUnique({
      where: { id: newInspection.id },
      include: {
        selectedCategories: {
          include: { category: true }
        },
        results: true
      }
    });

    return NextResponse.json(updatedInspection, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}