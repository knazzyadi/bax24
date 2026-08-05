// src/app/api/cron/run-maintenance/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  addDays,
  addMonths,
  addYears,
  startOfDay,
  differenceInDays,
} from "date-fns";

// ==============================
// Types
// ==============================

type TargetAsset = {
  id: string;
};

type WorkOrderResult = {
  scheduleId: string;
  workOrderId: string;
  assetsCount: number;
};


// ==============================
// Helper: توليد كود أمر العمل
// ==============================

async function generateWorkOrderCode(
  branchId: string
): Promise<{ code: string; branchSeqNum: number }> {

  return prisma.$transaction(async (tx) => {

    const counter = await tx.workOrderCounter.upsert({
      where: { branchId },
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


    const branch = await tx.branch.findUnique({
      where: {
        id: branchId,
      },
      select: {
        code: true,
      },
    });


    const prefix = branch?.code || "BR";

    const padded = counter.lastValue
      .toString()
      .padStart(4, "0");


    return {
      code: `${prefix}-WO-${padded}`,
      branchSeqNum: counter.lastValue,
    };
  });
}


// ==============================
// Helper: حساب تاريخ الاستحقاق التالي
// ==============================

function getNextDueDate(
  lastRun: Date,
  frequency: string
): Date {

  switch (frequency) {

    case "DAILY":
      return addDays(lastRun, 1);

    case "WEEKLY":
      return addDays(lastRun, 7);

    case "MONTHLY":
      return addMonths(lastRun, 1);

    case "YEARLY":
      return addYears(lastRun, 1);

    default:
      return addDays(lastRun, 30);
  }
}


// ==============================
// Helper: تنسيق التاريخ
// ==============================

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}


// ==============================
// API Route (Cron)
// ==============================

export async function GET() {

  try {

    const today = startOfDay(new Date());


    const schedules =
      await prisma.maintenanceSchedule.findMany({

        where: {
          isActive: true,
        },

        include: {

          assetType: true,

          scheduleAssets: {
            include: {
              asset: true,
            },
          },

          branch: true,

          building: true,
        },
      });



    let executedCount = 0;


    const results: WorkOrderResult[] = [];



    for (const schedule of schedules) {


      const lastRun =
        schedule.lastRunAt || schedule.createdAt;


      const nextDue =
        getNextDueDate(
          lastRun,
          schedule.frequency
        );


      const daysUntilDue =
        differenceInDays(
          nextDue,
          today
        );


      const shouldCreate =
        daysUntilDue <= schedule.leadDays &&
        daysUntilDue >= 0;


      if (!shouldCreate) {
        continue;
      }



      let targetAssets: TargetAsset[] = [];



      if (schedule.scheduleAssets.length > 0) {


        targetAssets =
          schedule.scheduleAssets.map(
            (item) => ({
              id: item.asset.id,
            })
          );


      } else if (schedule.assetTypeId) {


        const assetFilter: {
          companyId: string;
          deletedAt: null;
          typeId: string;
          buildingId?: string;
          building?: {
            branchId: string;
          };
        } = {

          companyId: schedule.companyId,

          deletedAt: null,

          typeId: schedule.assetTypeId,
        };



        if (schedule.buildingId) {

          assetFilter.buildingId =
            schedule.buildingId;

        } else if (schedule.branchId) {

          assetFilter.building = {
            branchId: schedule.branchId,
          };

        }



        targetAssets =
          await prisma.asset.findMany({

            where: assetFilter,

            select: {
              id: true,
            },

          });

      }



      if (targetAssets.length === 0) {
        continue;
      }



      if (!schedule.branchId) {

        console.warn(
          `لا يوجد branchId للجدول ${schedule.id}`
        );

        continue;
      }



      const {
        code,
        branchSeqNum,
      } =
        await generateWorkOrderCode(
          schedule.branchId
        );



      const workOrder =
        await prisma.workOrder.create({

          data: {

            title:
              `${schedule.name} - ${formatDate(today)}`,

            description:
              `صيانة دورية تلقائية لـ ${targetAssets.length} أصل (من جدول ${schedule.name})`,

            type:
              "BULK_PREVENTIVE",

            priorityId: null,

            statusId: null,

            branchId:
              schedule.branchId,

            companyId:
              schedule.companyId,

            createdBy:
              "SYSTEM_CRON",

            assetTypeId:
              schedule.assetTypeId,

            code,

            branchSeqNum,


            workOrderAssets: {

              create:
                targetAssets.map(
                  (asset) => ({
                    assetId: asset.id,
                    quantity: 1,
                  })
                ),

            },

          },

        });



      await prisma.maintenanceSchedule.update({

        where: {
          id: schedule.id,
        },

        data: {
          lastRunAt: today,
        },

      });



      executedCount++;


      results.push({

        scheduleId:
          schedule.id,

        workOrderId:
          workOrder.id,

        assetsCount:
          targetAssets.length,

      });

    }



    return NextResponse.json({

      message:
        `تمت معالجة ${schedules.length} جدول، تم إنشاء ${executedCount} أمر عمل`,

      details:
        results,

    });



  } catch (error) {


    console.error(
      "CRON_MAINTENANCE_ERROR:",
      error
    );


    return NextResponse.json(

      {
        error:
          "فشل تنفيذ المهمة المجدولة",
      },

      {
        status: 500,
      }

    );

  }
}