// src/app/api/inspection-sections/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { InspectionSectionRepository } from "@/lib/repositories/inspection-section.repository";
import { CreateInspectionSectionSchema } from "@/lib/validations/inspection-section.schema";

// GET: جلب جميع الأقسام (مع إمكانية تصفية النشطة فقط)
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

    // التحقق من وجود query parameter "active=true"
    const activeOnly =
      req.nextUrl.searchParams.get("active") === "true";

    const sections = await prisma.inspectionSection.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching inspection sections:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: إنشاء قسم جديد
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

    // التحقق من صحة البيانات
    const validation = CreateInspectionSectionSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage =
        validation.error.issues[0]?.message ?? "بيانات غير صالحة";

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const {
      code,
      name,
      nameAr,
      description,
      sortOrder,
      isActive,
    } = validation.data;

    // التحقق من عدم وجود كود مكرر
    const existing = await InspectionSectionRepository.findByCode(
      code,
      companyId
    );

    if (existing) {
      return NextResponse.json(
        { error: "Section code already exists" },
        { status: 409 }
      );
    }

    // التحقق من عدم وجود اسم مكرر
    const existingName = await prisma.inspectionSection.findFirst({
      where: {
        companyId,
        OR: [
          { name: name.trim() },
          { nameAr: nameAr?.trim() },
        ].filter(
          (condition) => condition !== undefined && condition !== null
        ),
        deletedAt: null,
      },
    });

    if (existingName) {
      return NextResponse.json(
        { error: "Section with this name already exists" },
        { status: 409 }
      );
    }

    const section = await InspectionSectionRepository.create({
      companyId,
      code: code.trim(),
      name: name.trim(),
      nameAr: nameAr?.trim() || null,
      description: description?.trim() || null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection section:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}