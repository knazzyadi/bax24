// src/app/api/work-order-priorities/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty ids array" },
        { status: 400 }
      );
    }

    await Promise.all(
      ids.map((id, index) =>
        prisma.workOrderPriority.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

    return NextResponse.json({ message: "Reordered successfully" });
  } catch (error) {
    console.error("Error reordering:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}