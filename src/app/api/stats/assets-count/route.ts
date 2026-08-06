// src/app/api/stats/assets-count/route.ts

import { NextResponse } from "next/server";

import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة" },
        { status: 400 }
      );
    }

    const isAdmin =
      session.role === "ADMIN" ||
      session.role === "SUPER_ADMIN";

    const branchIds = session.branchIds ?? [];

    const where: Prisma.AssetWhereInput = {
      companyId,
      deletedAt: null,
    };

    if (!isAdmin) {
      if (branchIds.length === 0) {
      return NextResponse.json({
        count: 0,
      });
      }

      where.room = {
        floor: {
          building: {
            branchId: {
              in: branchIds,
            },
          },
        },
      };
    }

    const count = await prisma.asset.count({
      where,
    });

  return NextResponse.json({
    count,
  });
  } catch (error) {
    console.error(
      "GET /api/stats/assets-count error:",
      error
    );

    return NextResponse.json(
      { error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}