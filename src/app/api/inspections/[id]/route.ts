// src/app/api/inspections/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { RiskLevel, FindingStatus, ResultStatus } from "@prisma/client";

// ============================================================
// Types
// ============================================================
type FindingInput = {
  title?: string;
  text?: string;
  description?: string;
  riskLevel?: RiskLevel;
  correctiveAction?: string;
  dueDate?: string | Date | null;
  status?: FindingStatus;
  createdById?: string | null;
};
type CategoryGroup = {
  categoryId: string | null;
  categoryName: string | null;
  categoryNameAr: string | null;

  items: Array<{
    id: string;
    itemId: string | null;
    code: string | null;
    name: string | null;
    nameAr: string | null;
    description: string | null;
    riskLevel: RiskLevel | null;
    inputType: string | null;
    sortOrder: number;
    autoCreateWorkOrder: boolean;
    result: unknown;
  }>;
};

// ============================================================
// GET: جلب بيانات الفحص (مع النتائج والملاحظات)
// ============================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id } = await params;
    const inspection = await prisma.inspection.findUnique({
      where: {
        id,
      },
      include: {
        formItems: {
          orderBy: {
            sortOrder: "asc",
          },
          include: {
            results: {
              include: {
                findings: true,
              },
            },
          },
        },
      },
    });
    if (!inspection) {
      return NextResponse.json(
        {
          error: "Inspection not found",
        },
        {
          status:404,
        }
      );
    }
    const categoriesMap = new Map<string | null, CategoryGroup>();
    inspection.formItems.forEach((item)=>{
      const catId = item.categoryId;
      if(!categoriesMap.has(catId)){
        categoriesMap.set(catId,{
          categoryId:catId,
          categoryName:item.categoryName,
          categoryNameAr:item.categoryNameAr,
          items:[],
        });
      }
      const result = item.results?.[0] ?? null;
      categoriesMap.get(catId)!.items.push({
        id:item.id,
        itemId:item.itemId,
        code:item.itemCode,
        name:item.itemName,
        nameAr:item.itemNameAr,
        description:item.description,
        riskLevel:
          item.riskLevel
            ? (item.riskLevel as RiskLevel)
            : null,
        inputType:item.inputType,
        sortOrder:item.sortOrder,
        autoCreateWorkOrder:item.autoCreateWorkOrder,
        result,
      });
    });
    const categories = Array.from(
      categoriesMap.values()
    );
    return NextResponse.json({
      ...inspection,
      categories,
    });
  } catch(error){
    console.error(
      "❌ Error fetching inspection:",
      error
    );
    return NextResponse.json(
      {
        error:"Internal Server Error",
        details:
          error instanceof Error
          ? error.message
          : String(error),
      },
      {
        status:500,
      }
    );
  }
}
// ============================================================
// PUT: تحديث بيانات الفحص (بما في ذلك النتائج والملاحظات)
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        {
          error:"Unauthorized",
        },
        {
          status:401,
        }
      );
    }
    const { id } = await params;
    const body = await req.json();
    const {
      title,
      scheduledDate,
      status,
      notes,
      inspectorId,
      branchId,
      buildingId,
      floorId,
      roomId,
      results,
    } = body;
    const existing = await prisma.inspection.findUnique({
      where:{
        id,
      },
      select:{
        companyId:true,
      },
    });
    if(!existing){
      return NextResponse.json(
        {
          error:"Inspection not found",
        },
        {
          status:404,
        }
      );
    }
    await prisma.inspection.update({
      where:{
        id,
      },
      data:{
        title:title?.trim(),
        scheduledDate:
          scheduledDate
          ? new Date(scheduledDate)
          : undefined,
        status,
        notes:
          notes || undefined,
        inspectorId:
          inspectorId || undefined,
        branchId:
          branchId || undefined,
        buildingId:
          buildingId || undefined,
        floorId:
          floorId || undefined,
        roomId:
          roomId || undefined,
      },
    });
        if (results && Array.isArray(results)) {
      for (const resultData of results) {
        const {
          inspectionFormItemId,
          result,
          notes: resultNotes,
          workOrderId,
          findings,
        } = resultData as {
          inspectionFormItemId: string;
          result: string;
          notes?: string;
          workOrderId?: string;
          findings?: FindingInput[];
        };

        if (!inspectionFormItemId) {
          continue;
        }

        const existingResult =
          await prisma.inspectionResult.findFirst({
            where: {
              inspectionId: id,
              inspectionFormItemId,
            },
          });

        const createFindings = async (
          inspectionResultId: string
        ) => {
          if (!findings || findings.length === 0) {
            return;
          }

          const findingsData = findings.map(
            (f: FindingInput) => ({
              inspectionResultId,
              title:
                f.title ||
                f.text ||
                "ملاحظة تفتيش",

              description:
                f.description ||
                f.text ||
                null,

              riskLevel:
                f.riskLevel ??
                RiskLevel.medium,

              correctiveAction:
                f.correctiveAction ??
                null,

              dueDate:
                f.dueDate
                  ? new Date(f.dueDate)
                  : null,

              status:
                f.status ??
                FindingStatus.Open,

              createdById:
                f.createdById ??
                null,
            })
          );

          await prisma.inspectionFinding.createMany({
            data: findingsData,
          });
        };


        if (existingResult) {

          await prisma.inspectionResult.update({
            where: {
              id: existingResult.id,
            },
            data: {
              result: result as ResultStatus,
              notes: resultNotes,
              workOrderId,
            },
          });


          if (findings) {

            await prisma.inspectionFinding.deleteMany({
              where: {
                inspectionResultId:
                  existingResult.id,
              },
            });

            await createFindings(
              existingResult.id
            );
          }


        } else {

          const newResult =
            await prisma.inspectionResult.create({
              data: {
                inspectionId: id,
                inspectionFormItemId,
                result: result as ResultStatus,
                notes: resultNotes,
                workOrderId,
              },
            });


          await createFindings(
            newResult.id
          );
        }
      }
    }


    const fullInspection =
      await prisma.inspection.findUnique({
        where: {
          id,
        },
        include: {
          formItems: {
            orderBy: {
              sortOrder: "asc",
            },
            include: {
              results: {
                include: {
                  findings: true,
                },
              },
            },
          },
        },
      });


    const categoriesMap =
      new Map<string | null, CategoryGroup>();

    fullInspection?.formItems.forEach((item) => {

      const catId = item.categoryId;

      if (!categoriesMap.has(catId)) {

        categoriesMap.set(catId, {
          categoryId: catId,
          categoryName: item.categoryName,
          categoryNameAr: item.categoryNameAr,
          items: [],
        });
      }


      categoriesMap.get(catId)!.items.push({
        id: item.id,
        itemId: item.itemId,
        code: item.itemCode,
        name: item.itemName,
        nameAr: item.itemNameAr,
        description: item.description,
        riskLevel:
          item.riskLevel
            ? (item.riskLevel as RiskLevel)
            : null,
        inputType: item.inputType,
        sortOrder: item.sortOrder,
        autoCreateWorkOrder:
          item.autoCreateWorkOrder,
        result:
          item.results?.[0] ?? null,
      });

    });


    return NextResponse.json(
      {
        ...fullInspection,
        categories:
          Array.from(categoriesMap.values()),
      },
      {
        status: 200,
      }
    );

  } catch(error) {

    console.error(
      "❌ Error updating inspection:",
      error
    );

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