// src/app/api/inspection-categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
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

    // ✅ استخراج query parameters مع إضافة active
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");
    const activeOnly = searchParams.get("active") === "true";

    // ✅ التحقق من صحة templateId إذا تم إرساله
    if (templateId && templateId.trim() === "") {
      return NextResponse.json(
        { error: "templateId cannot be empty" },
        { status: 400 }
      );
    }

    // ✅ إذا تم إرسال templateId، تأكد من أنه ينتمي للشركة
    if (templateId) {
      const template = await prisma.inspectionTemplate.findFirst({
        where: {
          id: templateId,
          companyId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template not found or access denied" },
          { status: 404 }
        );
      }
    }

    // ✅ استبدال الاستدعاء بـ prisma مباشرة مع إضافة فلتر isActive
    const categories = await prisma.inspectionCategory.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(templateId ? { templateId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

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

    // ✅ التحقق من صحة البيانات باستخدام Schema
    const validation = CreateInspectionCategorySchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || "بيانات غير صالحة";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { templateId, code, name, nameAr, description, sortOrder, isActive } = validation.data;

    // ✅ التحقق من وجود النموذج الأم وأنه ينتمي للشركة
    const template = await prisma.inspectionTemplate.findFirst({
      where: {
        id: templateId,
        companyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Parent template not found or access denied" },
        { status: 404 }
      );
    }

    // ✅ التحقق من عدم وجود كود مكرر
    const existing = await InspectionCategoryRepository.findByCode(code, companyId);
    if (existing) {
      return NextResponse.json(
        { error: "Category code already exists" },
        { status: 409 }
      );
    }

    // ✅ التحقق من عدم وجود اسم مكرر داخل نفس النموذج
    const existingName = await prisma.inspectionCategory.findFirst({
      where: {
        companyId,
        templateId,
        OR: [
          { name: name.trim() },
          { nameAr: nameAr?.trim() },
        ].filter(condition => condition !== undefined && condition !== null),
        deletedAt: null,
      },
    });

    if (existingName) {
      return NextResponse.json(
        { error: "Category with this name already exists in this template" },
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
      sortOrder: sortOrder ?? 0,
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