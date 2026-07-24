// src/app/api/inspection-categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { InspectionCategoryRepository } from "@/lib/repositories/inspection-category.repository";
import { CreateInspectionCategorySchema } from "@/lib/validations/inspection-category.schema";

// GET: جلب الفئات (اختياري: حسب النموذج)
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
    const templateId = searchParams.get("templateId") || undefined;

    const categories = await InspectionCategoryRepository.findAll(companyId, templateId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching inspection categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: إنشاء فئة جديدة
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

    // ✅ التحقق من صحة البيانات باستخدام Schema الجديد
    const validation = CreateInspectionCategorySchema.safeParse(body);
    if (!validation.success) {
      // ✅ استخدام issues بدلاً من errors (Zod v3+)
      const errorMessage = validation.error?.issues?.[0]?.message || "بيانات غير صالحة";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { templateId, code, name, nameAr, description, sortOrder, isActive } = validation.data;

    // ✅ التحقق من عدم وجود كود مكرر
    const existing = await InspectionCategoryRepository.findByCode(code, companyId);
    if (existing) {
      return NextResponse.json(
        { error: "Category code already exists" },
        { status: 409 }
      );
    }

    const category = await InspectionCategoryRepository.create({
      companyId,
      templateId,
      code: code.trim(),
      name: name.trim(),
      nameAr: nameAr?.trim() || null,
      description: description?.trim() || null,
      sortOrder: sortOrder || 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}