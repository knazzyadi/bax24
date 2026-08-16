// src/app/api/audit/[entityType]/[entityId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      entityType: string;
      entityId: string;
    }>;
  }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { entityType, entityId } = await params;

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("❌ Error fetching audit logs:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}