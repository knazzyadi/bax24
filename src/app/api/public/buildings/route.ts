import { NextResponse } from "next/server";



import { prisma } from '@/lib/prisma';
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const token = searchParams.get("token");
    const branchId = searchParams.get("branchId");

    if (!slug || !token || !branchId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({
      where: { slug, publicToken: token, allowPublicTickets: true },
      select: { id: true, companyId: true },
    });

    if (!branch) {
      return NextResponse.json({ error: "Invalid branch" }, { status: 403 });
    }

    if (branch.id !== branchId) {
      return NextResponse.json({ error: "Branch mismatch" }, { status: 403 });
    }

    const buildings = await prisma.building.findMany({
      where: { branchId: branch.id },
      select: { id: true, name: true, nameEn: true, code: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(buildings);
  } catch (error) {
    console.error("Public buildings API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}