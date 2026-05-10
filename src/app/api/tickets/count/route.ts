import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const companyId = session.user.companyId;

    const count = await prisma.ticket.count({
      where: {
        companyId,
        status: status,
        deletedAt: null,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching pending tickets count:", error);
    return NextResponse.json({ error: "خطأ في جلب العدد" }, { status: 500 });
  }
}