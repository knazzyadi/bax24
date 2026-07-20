// src/app/api/inspection-categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// ✅ GET - جلب عنوان رئيسي واحد
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // ✅ استخدم await

    const category = await prisma.inspectionCategory.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ PUT - تحديث عنوان رئيسي
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // ✅ استخدم await
    const body = await req.json();
    const { name, nameAr, description, isActive } = body;

    // التحقق من وجود السجل
    const existing = await prisma.inspectionCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // التحقق من صحة الإدخال
    if (!name?.trim() && !nameAr?.trim()) {
      return NextResponse.json(
        { error: "Name is required in at least one language" },
        { status: 400 }
      );
    }

    const updatedCategory = await prisma.inspectionCategory.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        nameAr: nameAr?.trim() || null,
        description: description?.trim() || null,
        isActive: isActive ?? existing.isActive,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ DELETE - حذف عنوان رئيسي
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // ✅ استخدم await

    const existing = await prisma.inspectionCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await prisma.inspectionCategory.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}