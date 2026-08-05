// src/app/api/inspection-findings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession, requirePermission } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import { Prisma, ResultStatus, FindingStatus, RiskLevel } from "@prisma/client";

// ============================================================
// Helper: توليد كود أمر العمل
// ============================================================
async function generateWorkOrderCode(): Promise<string> {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `WO-${timestamp}-${random}`;
}

// ============================================================
// POST: إنشاء ملاحظة (Finding) مع إمكانية إنشاء WorkOrder تلقائي
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    await requirePermission("inspections.create");

    const userId = session.userId;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة بالمستخدم" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      inspectionResultId,
      title,
      description,
      riskLevel,
      correctiveAction,
      dueDate,
    } = body;

    if (!inspectionResultId) {
      return NextResponse.json(
        { error: "معرف النتيجة مطلوب" },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "العنوان مطلوب" },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "الوصف مطلوب" },
        { status: 400 }
      );
    }

    const result = await prisma.inspectionResult.findFirst({
      where: {
        id: inspectionResultId,
        inspectionFormItem: {
          inspection: {
            companyId,
          },
        },
      },
      include: {
        inspectionFormItem: {
          include: {
            inspection: {
              include: {
                branch: true,
                building: true,
                floor: true,
                room: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "النتيجة غير موجودة أو لا تنتمي للشركة" },
        { status: 404 }
      );
    }

    if (result.result !== ResultStatus.fail) {
      return NextResponse.json(
        { error: "لا يمكن إنشاء ملاحظة إلا لنتيجة من نوع Fail" },
        { status: 400 }
      );
    }

    const existingFinding = await prisma.inspectionFinding.findFirst({
      where: {
        inspectionResultId,
      },
    });

    if (existingFinding) {
      return NextResponse.json(
        { error: "يوجد بالفعل ملاحظة مرتبطة بهذه النتيجة" },
        { status: 409 }
      );
    }

    const formItem = result.inspectionFormItem;
    const inspection = formItem.inspection;

    const { finding, workOrder, autoCreated } =
      await prisma.$transaction(async (tx) => {

        const finding = await tx.inspectionFinding.create({
          data: {
            inspectionResultId,
            title: title.trim(),
            description: description.trim(),
            riskLevel: riskLevel || "MEDIUM",
            correctiveAction: correctiveAction?.trim() || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            status: "Open",
            createdById: userId,
          },
        });

        let workOrder = null;
        let autoCreated = false;

        if (formItem.autoCreateWorkOrder) {

          const defaultStatus =
            await tx.workOrderStatus.findFirst({
              where: {
                companyId,
                isDefault: true,
              },
              select: {
                id: true,
              },
            });

          if (defaultStatus) {

            const defaultPriority =
              await tx.workOrderPriority.findFirst({
                where: {
                  companyId,
                  isDefault: true,
                },
                select: {
                  id: true,
                },
              });


            const code = await generateWorkOrderCode();


            const lastSeqNum =
              await tx.workOrder.aggregate({
                where: {
                  branchId: inspection.branchId || undefined,
                },
                _max: {
                  branchSeqNum: true,
                },
              });


            const branchSeqNum =
              (lastSeqNum._max.branchSeqNum || 0) + 1;


            const itemName =
              formItem.itemName || "بند غير معروف";


            workOrder =
              await tx.workOrder.create({
                data: {
                  code,
                  branchSeqNum,

                  title: `${itemName} - ${title}`,

                  description:
                    `تم إنشاء هذا الأمر تلقائياً من الملاحظة: ${description}`,

                  type: "CORRECTIVE",

                  statusId: defaultStatus.id,

                  priorityId:
                    defaultPriority?.id ?? undefined,

                  branchId: inspection.branchId!,

                  roomId:
                    inspection.roomId ?? undefined,

                  companyId,

                  createdBy: userId,

                  source: "inspection_finding",

                  sourceId: finding.id,

                  notes:
                    correctiveAction ?? undefined,
                },
              });


            await tx.workOrderFinding.create({
              data: {
                workOrderId: workOrder.id,
                findingId: finding.id,
              },
            });


            await tx.inspectionFinding.update({
              where: {
                id: finding.id,
              },
              data: {
                status: "InProgress",
              },
            });


            autoCreated = true;
          }
        }


        return {
          finding,
          workOrder,
          autoCreated,
        };
      });


    return NextResponse.json(
      {
        finding,
        workOrder,
        autoCreated,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.error(
      "POST /api/inspection-findings error:",
      error
    );

    return NextResponse.json(
      {
        error: "حدث خطأ في الخادم",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
// ============================================================
// GET: جلب قائمة الملاحظات مع خيارات التصفية
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    await requirePermission("inspections.read");

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "لا توجد شركة مرتبطة" },
        { status: 400 }
      );
    }

    const searchParams = req.nextUrl.searchParams;

    const status = searchParams.get("status");
    const riskLevel = searchParams.get("riskLevel") as RiskLevel | null;
    const inspectionId = searchParams.get("inspectionId");
    const search = searchParams.get("search") || "";

    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;


    // ============================================================
    // Prisma Where Type
    // ============================================================
    const where: Prisma.InspectionFindingWhereInput = {
      inspectionResult: {
        inspectionFormItem: {
          inspection: {
            companyId,
          },

          ...(inspectionId && {
            inspectionId,
          }),
        },
      },

      ...(status && {
        status: status as FindingStatus,
      }),

      ...(riskLevel && {
        riskLevel,
      }),

      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };


    const [findings, total] = await Promise.all([

      prisma.inspectionFinding.findMany({

        where,

        include: {

          inspectionResult: {

            include: {

              inspectionFormItem: {

                include: {

                  inspection: {

                    select: {
                      id: true,
                      title: true,
                      code: true,
                    },

                  },

                },

              },

            },

          },


          workOrders: {

            include: {

              workOrder: {

                select: {

                  id: true,
                  code: true,
                  title: true,

                  status: {

                    select: {

                      id: true,
                      name: true,
                      nameEn: true,
                      color: true,

                    },

                  },

                },

              },

            },

          },

        },

        orderBy: {
          createdAt: "desc",
        },

        skip,

        take: limit,

      }),


      prisma.inspectionFinding.count({
        where,
      }),

    ]);


    return NextResponse.json({

      data: findings,

      total,

      page,

      limit,

      totalPages: Math.ceil(total / limit),

    });


  } catch (error) {

    console.error(
      "GET /api/inspection-findings error:",
      error
    );


    return NextResponse.json(

      {
        error: "حدث خطأ في الخادم",

        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },

      {
        status: 500,
      }

    );

  }
}