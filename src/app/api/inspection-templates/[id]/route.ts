// src/app/api/inspection-templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { InspectionTemplateRepository } from "@/lib/repositories/inspection-template.repository";
import { UpdateInspectionTemplateSchema } from "@/lib/validations/inspection-template.schema";

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
    const template = await InspectionTemplateRepository.findById(id, companyId);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching inspection template:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
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
    const body = await req.json();

    // ✅ التحقق من صحة البيانات باستخدام Zod (Zod v4)
    const validation = UpdateInspectionTemplateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const template = await InspectionTemplateRepository.update(id, companyId, validation.data);

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Error updating inspection template:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
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
    await InspectionTemplateRepository.delete(id, companyId);

    return NextResponse.json(
      { message: "Template deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting inspection template:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}