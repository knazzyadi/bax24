// src/app/api/inspection-categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma"; // تأكد من مسار الـ Prisma Client الخاص بك

// GET: جلب جميع العناوين مع عدد البنود المرتبطة
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.inspectionCategory.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    // إعادة تنسيق البيانات لتتناسب مع الـ Frontend (إضافة itemsCount)
    const formattedCategories = categories.map((cat) => ({
      ...cat,
      itemsCount: cat._count.items,
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error("Error fetching inspection categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: إنشاء عنوان رئيسي جديد
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, nameAr, description, isActive } = body;

    // التحقق من صحة الإدخال
    if (!name?.trim() && !nameAr?.trim()) {
      return NextResponse.json(
        { error: "Name is required in at least one language" },
        { status: 400 }
      );
    }

    const newCategory = await prisma.inspectionCategory.create({
      data: {
        name: name?.trim() || nameAr?.trim() || "Untitled",
        nameAr: nameAr?.trim() || null,
        description: description?.trim() || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}