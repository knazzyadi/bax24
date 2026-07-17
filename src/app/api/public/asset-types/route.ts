// src/app/api/public/asset-types/route.ts
import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const token = searchParams.get("token");

    if (!slug || !token) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({
      where: { slug, publicToken: token },
      select: { companyId: true, allowPublicTickets: true },
    });

    if (!branch || !branch.allowPublicTickets) {
      return NextResponse.json({ error: "Invalid branch or public tickets disabled" }, { status: 403 });
    }

    // ✅ استبعاد الأنواع المحذوفة
    const assetTypes = await prisma.assetType.findMany({
      where: {
        companyId: branch.companyId,
        deletedAt: null, // ✅ الشرط المهم
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        order: true,
        isDefault: true,
      },
    });

    return NextResponse.json({ assetTypes });
  } catch (error) {
    console.error("Public asset types API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}