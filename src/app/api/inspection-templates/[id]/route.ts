// src/app/api/inspection-templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { InspectionTemplateRepository } from "@/lib/repositories/inspection-template.repository";
import { UpdateInspectionTemplateSchema } from "@/lib/validations/inspection-template.schema";

// Helper functions for error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Internal Server Error";
}

function isPrismaError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  );
}

// GET: جلب نموذج معين
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { id } = await params;

    if (!id || id.trim() === "") {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const template = await InspectionTemplateRepository.findById(id, companyId);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error: unknown) {
    console.error("Error fetching inspection template:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PUT: تحديث نموذج
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { id } = await params;

    if (!id || id.trim() === "") {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const validation = UpdateInspectionTemplateSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error?.issues?.[0]?.message || "بيانات غير صالحة";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const existing = await prisma.inspectionTemplate.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found or access denied" },
        { status: 404 }
      );
    }

    const updateData = validation.data;
    if (updateData.name) {
      const duplicate = await prisma.inspectionTemplate.findFirst({
        where: {
          companyId,
          sectionId: updateData.sectionId,
          name: updateData.name.trim(),
          id: { not: id },
          deletedAt: null,
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Another template with this name already exists in the same section" },
          { status: 409 }
        );
      }
    }

    const template = await InspectionTemplateRepository.update(id, companyId, updateData);

    return NextResponse.json(template);
  } catch (error: unknown) {
    console.error("Error updating inspection template:", error);

    if (isPrismaError(error) && error.code === "P2025") {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE: حذف نموذج (حذف منطقي)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { id } = await params;

    if (!id || id.trim() === "") {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.inspectionTemplate.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found or access denied" },
        { status: 404 }
      );
    }

    const childCategories = await prisma.inspectionCategory.findFirst({
      where: {
        templateId: id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (childCategories) {
      return NextResponse.json(
        { error: "Cannot delete template with existing categories. Please delete all categories first." },
        { status: 409 }
      );
    }

    await InspectionTemplateRepository.delete(id, companyId);

    return NextResponse.json(
      { message: "Template deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error deleting inspection template:", error);

    if (isPrismaError(error) && error.code === "P2025") {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}