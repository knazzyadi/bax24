// src/app/api/inspection-items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";

// Helper function to generate a unique code for item
function generateItemCode(name: string, categoryCode: string): string {
  // Take first 3 letters of name, uppercase, add category prefix and timestamp
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase();
  const suffix = Date.now().toString().slice(-4);
  return `${categoryCode}-${prefix}${suffix}`;
}

// GET: جلب البنود الخاصة بفئة معينة (categoryId)
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    // ✅ التحقق من أن الفئة تنتمي للشركة
    const category = await prisma.inspectionCategory.findFirst({
      where: {
        id: categoryId,
        companyId,
        deletedAt: null,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    const items = await prisma.inspectionItem.findMany({
      where: {
        categoryId,
        deletedAt: null,
      },
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
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const body = await req.json();
    const {
      categoryId,
      name,
      nameAr,
      cbahiCode,
      description,
      riskLevel,
      inputType,
      sortOrder,
      isActive,
      autoCreateWorkOrder,
      code: providedCode,
    } = body;

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

    // ✅ التأكد من وجود الفئة الأم وأنها تنتمي للشركة
    const categoryExists = await prisma.inspectionCategory.findFirst({
      where: {
        id: categoryId,
        companyId,
        deletedAt: null,
      },
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Parent category not found or access denied" },
        { status: 404 }
      );
    }

    // ✅ التحقق من عدم وجود بند بنفس الاسم في نفس الشركة
    const existingName = await prisma.inspectionItem.findFirst({
      where: {
        companyId,
        name: name?.trim(),
        deletedAt: null,
      },
    });

    if (existingName) {
      return NextResponse.json(
        { error: "Item with this name already exists in this company" },
        { status: 409 }
      );
    }

    // ✅ توليد كود فريد إذا لم يتم توفيره
    const finalCode = providedCode?.trim() || generateItemCode(name || nameAr || "ITEM", categoryExists.code);

    // ✅ التحقق من عدم وجود كود مكرر في نفس الشركة
    const existingCode = await prisma.inspectionItem.findFirst({
      where: {
        companyId,
        code: finalCode,
        deletedAt: null,
      },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Item code already exists" },
        { status: 409 }
      );
    }

    const newItem = await prisma.inspectionItem.create({
      data: {
        companyId,
        categoryId,
        code: finalCode,
        name: name?.trim() || nameAr?.trim() || "Unnamed Item",
        nameAr: nameAr?.trim() || null,
        cbahiCode: cbahiCode?.trim() || null,
        description: description?.trim() || null,
        riskLevel: riskLevel || "medium",
        inputType: inputType || "pass_fail",
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
        autoCreateWorkOrder: autoCreateWorkOrder ?? false,
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