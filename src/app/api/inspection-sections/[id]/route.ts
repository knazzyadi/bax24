// src/app/api/inspection-sections/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { InspectionSectionRepository } from "@/lib/repositories/inspection-section.repository";
import { UpdateInspectionSectionSchema } from "@/lib/validations/inspection-section.schema";

// GET: جلب قسم معين
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
    const section = await InspectionSectionRepository.findById(id, companyId);

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("Error fetching inspection section:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT: تحديث قسم
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
    const validation = UpdateInspectionSectionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const section = await InspectionSectionRepository.update(id, companyId, validation.data);

    return NextResponse.json(section);
  } catch (error: any) {
    console.error("Error updating inspection section:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: حذف قسم (حذف منطقي)
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
    await InspectionSectionRepository.delete(id, companyId);

    return NextResponse.json(
      { message: "Section deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting inspection section:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}