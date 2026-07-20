import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

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

    console.log("🔍 Fetching inspection with ID:", id);

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        selectedCategories: {
          orderBy: { sortOrder: "asc" },
          include: {
            category: {
              include: {
                items: {
                  where: { isActive: true },
                  orderBy: { sortOrder: "asc" }
                }
              }
            }
          }
        },
        results: { include: { item: true } }
      }
    });

    if (!inspection) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }

    // بناء هيكل البيانات المنظم للواجهة
    const resultsMap = new Map();
    inspection.results.forEach(r => resultsMap.set(r.itemId, r));

    const structuredData = inspection.selectedCategories.map(sel => ({
      categoryId: sel.categoryId,
      categoryName: sel.category.name,
      categoryNameAr: sel.category.nameAr,
      items: sel.category.items.map(item => ({
        ...item,
        result: resultsMap.get(item.id) || null
      }))
    }));

    return NextResponse.json({
      ...inspection,
      structuredData,
      resultsMap: Object.fromEntries(resultsMap)
    });
  } catch (error) {
    console.error("❌ Error fetching inspection:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}