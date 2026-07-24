// src/app/api/inspection-items/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// ✅ GET - جلب بند فرعي واحد
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const item = await prisma.inspectionItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ PUT - تحديث بند فرعي
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      nameAr,
      cbahiCode,
      description, // ✅ إضافة الوصف
      riskLevel,
      inputType,
      sortOrder,
      isActive,
    } = body;

    // التحقق من وجود السجل
    const existing = await prisma.inspectionItem.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // التحقق من صحة الإدخال
    if (!name?.trim() && !nameAr?.trim()) {
      return NextResponse.json(
        { error: "Item name is required in at least one language" },
        { status: 400 }
      );
    }

    // تحديث البيانات
    const updatedItem = await prisma.inspectionItem.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        nameAr: nameAr?.trim() !== undefined ? nameAr?.trim() || null : existing.nameAr,
        cbahiCode: cbahiCode?.trim() || null,
        description: description?.trim() !== undefined ? description?.trim() || null : existing.description, // ✅ تحديث الوصف
        riskLevel: riskLevel || existing.riskLevel,
        inputType: inputType || existing.inputType,
        sortOrder: sortOrder ?? existing.sortOrder,
        isActive: isActive ?? existing.isActive,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ DELETE - حذف بند فرعي
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.inspectionItem.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.inspectionItem.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}