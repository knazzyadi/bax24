// src/app/api/cron/run-maintenance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, addMonths, addYears, isBefore, startOfDay, differenceInDays } from "date-fns";

// ==============================
// Helper: توليد كود أمر العمل
// ==============================
async function generateWorkOrderCode(branchId: string): Promise<{ code: string; branchSeqNum: number }> {
  const result = await prisma.$transaction(async (tx) => {
    const counter = await tx.workOrderCounter.upsert({
      where: { branchId },
      update: { lastValue: { increment: 1 } },
      create: { branchId, lastValue: 1 },
    });

    const branch = await tx.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });
    const prefix = branch?.code || "BR";
    const padded = counter.lastValue.toString().padStart(4, "0");
    const code = `${prefix}-WO-${padded}`;
    return { code, branchSeqNum: counter.lastValue };
  });

  return result;
}

// ==============================
// Helper: حساب تاريخ الاستحقاق التالي
// ==============================
function getNextDueDate(lastRun: Date, frequency: string): Date {
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
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { isActive: true },
      include: {
        assetType: true,
        scheduleAssets: { include: { asset: true } },
        branch: true,
        building: true,
      },
    });

    let executedCount = 0;
    const results = [];

    for (const schedule of schedules) {
      // حساب آخر تاريخ تنفيذ (إذا لم يكن موجوداً، نستخدم تاريخ الإنشاء)
      const lastRun = schedule.lastRunAt || schedule.createdAt;
      const nextDue = getNextDueDate(lastRun, schedule.frequency);
      const daysUntilDue = differenceInDays(nextDue, today);

      // إذا كان تاريخ اليوم ضمن نافذة التحضير (أي اليوم >= nextDue - leadDays) ولم يمر تاريخ الاستحقاق الحقيقي بعد
      const shouldCreate = daysUntilDue <= schedule.leadDays && daysUntilDue >= 0;

      if (!shouldCreate) continue;

      // جلب الأصول المستهدفة
      let targetAssets: any[] = [];
      if (schedule.scheduleAssets.length > 0) {
        targetAssets = schedule.scheduleAssets.map((sa: { asset: any }) => sa.asset);
      } else if (schedule.assetTypeId) {
        const assetFilter: any = { companyId: schedule.companyId, deletedAt: null, typeId: schedule.assetTypeId };
        if (schedule.buildingId) assetFilter.buildingId = schedule.buildingId;
        else if (schedule.branchId) assetFilter.building = { branchId: schedule.branchId };
        targetAssets = await prisma.asset.findMany({ where: assetFilter });
      }

      if (targetAssets.length === 0) continue;

      // التأكد من وجود branchId لتوليد الكود
      if (!schedule.branchId) {
        console.warn(`⚠️ لا يوجد branchId للجدول ${schedule.id}، سيتم تخطي إنشاء أمر العمل`);
        continue;
      }

      // توليد الكود والرقم التسلسلي
      const { code, branchSeqNum } = await generateWorkOrderCode(schedule.branchId);

      // إنشاء أمر عمل جماعي واحد
      const workOrder = await prisma.workOrder.create({
        data: {
          title: `${schedule.name} - ${formatDate(today)}`,
          description: `صيانة دورية تلقائية لـ ${targetAssets.length} أصل (من جدول ${schedule.name})`,
          type: "BULK_PREVENTIVE",
          priorityId: null,
          statusId: null,
          branchId: schedule.branchId,
          companyId: schedule.companyId,
          createdBy: "SYSTEM_CRON",
          assetTypeId: schedule.assetTypeId,
          code: code,                    // ✅ الكود الفريد
          branchSeqNum: branchSeqNum,    // ✅ الرقم التسلسلي للفرع
          workOrderAssets: {
            create: targetAssets.map((asset: any) => ({ 
              assetId: asset.id,
              quantity: 1,
            })),
          },
        },
      });

      // تحديث جدول الصيانة: lastRunAt = اليوم
      await prisma.maintenanceSchedule.update({
        where: { id: schedule.id },
        data: { lastRunAt: today },
      });

      executedCount++;
      results.push({ 
        scheduleId: schedule.id, 
        workOrderId: workOrder.id, 
        assetsCount: targetAssets.length 
      });
    }

    return NextResponse.json({
      message: `تمت معالجة ${schedules.length} جدول، تم إنشاء ${executedCount} أمر عمل`,
      details: results,
    });
  } catch (error) {
    console.error("CRON_MAINTENANCE_ERROR:", error);
    return NextResponse.json({ error: "فشل تنفيذ المهمة المجدولة" }, { status: 500 });
  }
}