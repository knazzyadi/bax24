// src/app/api/inspection-templates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { InspectionTemplateRepository } from "@/lib/repositories/inspection-template.repository";
import { CreateInspectionTemplateSchema } from "@/lib/validations/inspection-template.schema";

// GET: جلب جميع النماذج (اختياري: حسب القسم)
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("sectionId") || undefined;

    const templates =
      await InspectionTemplateRepository.findAll(
        companyId,
        sectionId
      );

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching inspection templates:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: إنشاء نموذج جديد
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // ✅ التحقق من صحة البيانات
    const validation =
      CreateInspectionTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error:
            validation.error.issues[0]?.message ??
            "Validation failed",
        },
        { status: 400 }
      );
    }

    const {
      sectionId,
      code,
      name,
      nameAr,
      description,
      sortOrder,
      isActive,
    } = validation.data;

    // ✅ التحقق من عدم وجود كود مكرر
    const existing =
      await InspectionTemplateRepository.findByCode(
        code,
        companyId
      );

    if (existing) {
      return NextResponse.json(
        { error: "Template code already exists" },
        { status: 409 }
      );
    }

    const template =
      await InspectionTemplateRepository.create({
        companyId,
        sectionId,
        code: code.trim(),
        name: name.trim(),
        nameAr: nameAr?.trim() || null,
        description: description?.trim() || null,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
      });

    return NextResponse.json(template, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "Error creating inspection template:",
      error
    );

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}