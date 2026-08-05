// src/app/api/maintenance/schedules/[id]/run/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/auth-helper";
import { prisma } from "@/lib/prisma";
import type { Asset, Prisma } from "@prisma/client";

// ==============================
// تعريف نوع المعاملة
// ==============================
type TransactionClient =
  Parameters<Parameters<typeof prisma.$transaction>[0]>[0];


// ==============================
// نوع أخطاء Prisma
// ==============================
type PrismaError = {
  code?: string;
  message?: string;
};


// ==============================
// Helper: توليد كود أمر العمل
// ==============================
async function generateWorkOrderCode(
  tx: TransactionClient,
  branchId: string
): Promise<{
  code: string;
  branchSeqNum: number;
}> {
  const counter =
    await tx.workOrderCounter.upsert({
      where: {
        branchId,
      },
      update: {
        lastValue: {
          increment: 1,
        },
      },
      create: {
        branchId,
        lastValue: 1,
      },
    });

  const branch =
    await tx.branch.findUnique({
      where: {
        id: branchId,
      },
      select: {
        code: true,
      },
    });

  const prefix =
    branch?.code ?? "BR";

  return {
    code: `${prefix}-WO-${counter.lastValue
      .toString()
      .padStart(4, "0")}`,
    branchSeqNum:
      counter.lastValue,
  };
}


// ==============================
// API Route
// ==============================
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let runRecord:
    | { id: string }
    | null = null;

  let totalAssets = 0;

  try {

    const session =
      await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "غير مصرح",
        },
        {
          status: 401,
        }
      );
    }


    const {
      userId,
      companyId,
    } = session;


    if (!companyId) {
      return NextResponse.json(
        {
          error:
            "لا توجد شركة مرتبطة",
        },
        {
          status: 400,
        }
      );
    }


    const { id } =
      await params;


    const schedule =
      await prisma.maintenanceSchedule.findFirst({
        where: {
          id,
          companyId,
          isActive: true,
        },
        include: {
          assetType: true,
          scheduleAssets: {
            include: {
              asset: true,
            },
          },
        },
      });


    if (!schedule) {
      return NextResponse.json(
        {
          error:
            "الجدول غير موجود أو غير نشط",
        },
        {
          status:404,
        }
      );
    }


    let targetAssets: Asset[] = [];


    if (
      schedule.scheduleAssets.length > 0
    ) {

      targetAssets =
        schedule.scheduleAssets.map(
          (item) =>
            item.asset
        );

    } else if (
      schedule.assetTypeId
    ) {

      const assetFilter:
        Prisma.AssetWhereInput = {

        companyId,

        deletedAt:null,

        typeId:
          schedule.assetTypeId,


        ...(schedule.branchId
          ? {
              branchId:
                schedule.branchId,
            }
          : {}),


        ...(schedule.buildingId
          ? {
              buildingId:
                schedule.buildingId,
            }
          : {}),


        ...(schedule.floorId
          ? {
              floorId:
                schedule.floorId,
            }
          : {}),


        ...(schedule.roomId
          ? {
              roomId:
                schedule.roomId,
            }
          : {}),
      };


      targetAssets =
        await prisma.asset.findMany({
          where:
            assetFilter,
        });
    }


    totalAssets =
      targetAssets.length;


    if (totalAssets === 0) {
      return NextResponse.json({
        status:"SUCCESS",
        totalAssets:0,
        message:
          "لا توجد أصول مستهدفة",
      });
    }


    if (!schedule.branchId) {
      return NextResponse.json(
        {
          error:
            "الجدول ليس له فرع مرتبط",
        },
        {
          status:400,
        }
      );
    }
    // ==============================
// Default Status & Priority
// ==============================

const [
  defaultStatus,
  defaultPriority,
] = await Promise.all([
  prisma.workOrderStatus.findFirst({
    where: {
      companyId,
      isDefault: true,
    },
    select: {
      id: true,
    },
  }),

  prisma.workOrderPriority.findFirst({
    where: {
      companyId,
      isDefault: true,
    },
    select: {
      id: true,
    },
  }),
]);


if (!defaultStatus) {
  return NextResponse.json(
    {
      error:
        "لا توجد حالة افتراضية لأوامر العمل",
    },
    {
      status:400,
    }
  );
}


// ==============================
// Create RUNNING Record
// ==============================

try {

  runRecord =
    await prisma.maintenanceScheduleRun.create({
      data: {
        scheduleId:id,

        status:"RUNNING",

        startedAt:
          new Date(),

        totalAssets,

        succeededAssets:0,

        failedAssets:0,

        executedById:
          userId,
      },

      select:{
        id:true,
      },
    });


} catch(error: unknown) {

  const prismaError =
    error as PrismaError;


  if (
    prismaError.code === "P2002"
  ) {
    return NextResponse.json(
      {
        error:
          "يوجد تنفيذ جارٍ لهذا الجدول بالفعل",
      },
      {
        status:409,
      }
    );
  }


  throw error;
}



if (!runRecord) {
  throw new Error(
    "فشل في إنشاء سجل التشغيل"
  );
}


const safeRunRecordId =
  runRecord.id;



// ==============================
// Transaction
// ==============================

const workOrder =
  await prisma.$transaction(
    async (tx) => {


      const {
        code,
        branchSeqNum,
      } =
        await generateWorkOrderCode(
          tx,
          schedule.branchId!
        );


      const today =
        new Date();



      const created =
        await tx.workOrder.create({
          data: {

            title:
              schedule.name,


            description:
              `صيانة دورية لـ ${totalAssets} أصل (من جدول ${schedule.name})`,


            type:
              "BULK_PREVENTIVE",


            branchId:
              schedule.branchId,


            buildingId:
              schedule.buildingId,


            floorId:
              schedule.floorId,


            roomId:
              schedule.roomId,


            locationLevel:
              schedule.locationLevel as
                | "building"
                | "floor"
                | "room"
                | null,


            companyId,


            createdBy:
              userId,


            assetTypeId:
              schedule.assetTypeId,


            source:
              "ppm",


            maintenanceScheduleId:
              schedule.id,


            sourceType:
              "MAINTENANCE_SCHEDULE",


            sourceId:
              schedule.id,


            code,


            branchSeqNum,


            statusId:
              defaultStatus.id,


            priorityId:
              defaultPriority?.id ??
              null,
          },

          select:{
            id:true,
            code:true,
          },
        });



      // ==============================
      // ربط الأصول
      // ==============================

      if (
        targetAssets.length > 0
      ) {

        await tx.workOrderAsset.createMany({
          data:
            targetAssets.map(
              (asset)=>({
                workOrderId:
                  created.id,

                assetId:
                  asset.id,
              })
            ),

          skipDuplicates:true,
        });

      }



      // ==============================
      // تحديث آخر تشغيل
      // ==============================

      await tx.maintenanceSchedule.update({
        where:{
          id:
            schedule.id,
        },

        data:{
          lastRunAt:
            today,
        },
      });



      // ==============================
      // تحديث سجل التشغيل
      // ==============================

      await tx.maintenanceScheduleRun.update({
        where:{
          id:
            safeRunRecordId,
        },

        data:{

          status:
            "SUCCESS",

          finishedAt:
            new Date(),

          totalAssets,

          succeededAssets:
            totalAssets,

          failedAssets:
            0,

          workOrderId:
            created.id,


          executedById:
            userId,


          notes:
            `تم إنشاء أمر العمل ${created.code} بنجاح`,
        },
      });



      return created;
    },

    {
      timeout:30000,
    }
  );
      // ==============================
    // التحقق من كود أمر العمل
    // ==============================

    if (!workOrder.code) {
      throw new Error(
        "كود أمر العمل غير صالح"
      );
    }


    return NextResponse.json(
      {
        message:
          `تم إنشاء أمر عمل برقم ${workOrder.code} يتضمن ${totalAssets} أصل`,

        workOrderId:
          workOrder.id,

        runId:
          safeRunRecordId,

        status:
          "SUCCESS",
      }
    );


  } catch(error: unknown) {

    console.error(
      "RUN_SCHEDULE_ERROR:",
      error
    );


    const errorMessage =
      error instanceof Error
        ? error.message
        : "حدث خطأ غير معروف";


    // تحديث سجل التشغيل إلى FAILED
    if (runRecord?.id) {

      await finalizeRun(
        runRecord.id,
        {
          status:
            "FAILED",

          errorMessage,

          totalAssets,

          succeededAssets:0,

          failedAssets:
            totalAssets,

          notes:
            `فشل التنفيذ: ${errorMessage}`,
        }
      );

    }


    return NextResponse.json(
      {
        error:
          errorMessage ||
          "فشل تنفيذ الجدول",
      },
      {
        status:500,
      }
    );
  }
}



// ==============================
// تحديث سجل التشغيل عند الفشل
// ==============================

async function finalizeRun(
  runId:string,

  data:{
    status:
      | "SUCCESS"
      | "FAILED";

    errorMessage?:
      | string
      | null;

    totalAssets:number;

    succeededAssets:number;

    failedAssets:number;

    notes?:
      | string
      | null;
  }
) {

  await prisma.maintenanceScheduleRun.update({

    where:{
      id:
        runId,
    },


    data:{

      status:
        data.status,


      finishedAt:
        new Date(),


      totalAssets:
        data.totalAssets,


      succeededAssets:
        data.succeededAssets,


      failedAssets:
        data.failedAssets,


      errorMessage:
        data.errorMessage ??
        null,


      notes:
        data.notes ??
        null,
    },
  });
}