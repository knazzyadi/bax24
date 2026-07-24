// src/app/api/inspections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { ResultStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        selectedCategories: {
          include: {
            category: true,
          },
        },
        results: true,
      },
    });

    const formatted = inspections.map((ins) => ({
      ...ins,
      _count: {
        totalItems: ins.results.length,
        completedItems: ins.results.filter((r) => r.result !== "na").length,
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
      categoryIds,
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

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: "At least one category is required" },
        { status: 400 }
      );
    }

    // إنشاء الفحص
    const newInspection = await prisma.inspection.create({
      data: {
        company: {
          connect: {
            id: session.companyId,
          },
        },

        title: title.trim(),
        scheduledDate: scheduledDate
          ? new Date(scheduledDate)
          : new Date(),

        inspectorId: inspectorId || null,
        branchId: branchId || null,
        buildingId: buildingId || null,
        floorId: floorId || null,
        roomId: roomId || null,
        notes: notes || null,

        status: "draft",

        selectedCategories: {
          create: categoryIds.map(
            (catId: string, index: number) => ({
              categoryId: catId,
              sortOrder: index,
            })
          ),
        },
      },

      include: {
        selectedCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    // جلب البنود
    const categoriesWithItems =
      await prisma.inspectionCategory.findMany({
        where: {
          id: {
            in: categoryIds,
          },
        },
        include: {
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

    // إنشاء النتائج
    const itemsToCreate = [];

    for (const category of categoriesWithItems) {
      for (const item of category.items) {
        itemsToCreate.push({
          inspectionId: newInspection.id,
          itemId: item.id,
          result: ResultStatus.na,
        });
      }
    }

    if (itemsToCreate.length > 0) {
      await prisma.inspectionResult.createMany({
        data: itemsToCreate,
      });
    }

    // إعادة الفحص
    const updatedInspection = await prisma.inspection.findUnique({
      where: {
        id: newInspection.id,
      },
      include: {
        selectedCategories: {
          include: {
            category: true,
          },
        },
        results: true,
      },
    });

    return NextResponse.json(updatedInspection, {
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