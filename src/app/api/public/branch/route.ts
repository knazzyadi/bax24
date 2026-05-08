import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const slug = searchParams.get("slug");
    const token = searchParams.get("token");

    if (!slug || !token) {
      return NextResponse.json(
        { error: "رابط غير مكتمل" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findFirst({
      where: {
        slug,
        publicToken: token,
        allowPublicTickets: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "الرابط غير صالح أو الخدمة غير مفعلة" },
        { status: 403 }
      );
    }

    return NextResponse.json({ branch });
  } catch (error) {
    return NextResponse.json(
      { error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}