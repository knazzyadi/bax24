import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const token = searchParams.get("token");
    const buildingId = searchParams.get("buildingId");

    if (!slug || !token || !buildingId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // التحقق من صحة الفرع
    const branch = await prisma.branch.findFirst({
      where: { slug, publicToken: token },
      select: { companyId: true, allowPublicTickets: true },
    });

    if (!branch || !branch.allowPublicTickets) {
      return NextResponse.json({ error: "Invalid branch or public tickets disabled" }, { status: 403 });
    }

    // جلب الأدوار التابعة للمبنى ولنفس الشركة
    const floors = await prisma.floor.findMany({
      where: {
        buildingId,
        building: { companyId: branch.companyId },
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        buildingId: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(floors);
  } catch (error) {
    console.error("Public floors API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}