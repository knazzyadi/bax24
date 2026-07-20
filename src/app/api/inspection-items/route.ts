// src/app/api/inspection-items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET: جلب البنود الخاصة بفئة معينة (categoryId)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    const items = await prisma.inspectionItem.findMany({
      where: { categoryId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching inspection items:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: إنشاء بند فرعي جديد
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { categoryId, name, nameAr, cbahiCode, riskLevel, inputType, sortOrder, isActive } = body;

    // التحقق من صحة الإدخال
    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }
    if (!name?.trim() && !nameAr?.trim()) {
      return NextResponse.json(
        { error: "Item name is required in at least one language" },
        { status: 400 }
      );
    }

    // التأكد من وجود الفئة الأم
    const categoryExists = await prisma.inspectionCategory.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return NextResponse.json(
        { error: "Parent category not found" },
        { status: 404 }
      );
    }

    const newItem = await prisma.inspectionItem.create({
      data: {
        categoryId,
        name: name?.trim() || nameAr?.trim() || "Unnamed Item",
        nameAr: nameAr?.trim() || null,
        cbahiCode: cbahiCode?.trim() || null,
        riskLevel: riskLevel || "medium",
        inputType: inputType || "pass_fail",
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}