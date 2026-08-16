import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";

export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 400 }
      );
    }

    const [
      branches,
      sections,
      templates,
      categories,
    ] = await Promise.all([
      prisma.branch.findMany({
        where: {
          companyId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          nameEn: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.inspectionSection.findMany({
        where: {
          companyId,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          nameAr: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      }),

      prisma.inspectionTemplate.findMany({
        where: {
          companyId,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          nameAr: true,
          sectionId: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      }),

      prisma.inspectionCategory.findMany({
        where: {
          companyId,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          nameAr: true,
          templateId: true,
          _count: {
            select: {
              items: {
                where: {
                  deletedAt: null,
                  isActive: true,
                },
              },
            },
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      branches,
      sections,
      templates,
      categories,
    });

  } catch (error) {
    console.error(
      "Error fetching inspection new data:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}