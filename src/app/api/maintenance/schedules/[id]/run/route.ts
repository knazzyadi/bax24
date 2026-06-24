// src/app/api/maintenance/schedules/[id]/run/route.ts
import { NextRequest, NextResponse } from "next/server";


import { prisma } from '@/lib/prisma';
import { getSession, requirePermission } from '@/lib/auth-helper';


import { addDays, format } from "date-fns";

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
// API Route
// ==============================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("maintenance.execute");

    const { id } = await params;
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    // 1. جلب الجدول مع العلاقات
    const schedule = await prisma.maintenanceSchedule.findFirst({
      where: { id, companyId, isActive: true },
      include: {
        assetType: true,
        branch: true,
        building: true,
        scheduleAssets: { include: { asset: true } },
      },
    });
    if (!schedule) {
      return NextResponse.json({ error: "الجدول غير موجود أو غير نشط" }, { status: 404 });
    }

    // 2. تحديد الأصول المستهدفة
    let targetAssets: any[] = [];
    if (schedule.scheduleAssets.length > 0) {
      targetAssets = schedule.scheduleAssets.map((sa: { asset: any }) => sa.asset);
    } else if (schedule.assetTypeId) {
      const assetFilter: any = {
        companyId,
        deletedAt: null,
        typeId: schedule.assetTypeId,
      };
      if (schedule.buildingId) {
        assetFilter.buildingId = schedule.buildingId;
      } else if (schedule.branchId) {
        assetFilter.building = { branchId: schedule.branchId };
      }
      targetAssets = await prisma.asset.findMany({ where: assetFilter });
    } else {
      return NextResponse.json({ error: "لا توجد أصول مستهدفة في هذا الجدول" }, { status: 400 });
    }

    if (targetAssets.length === 0) {
      return NextResponse.json({ message: "لا توجد أصول مستحقة للصيانة" });
    }

    // 3. التأكد من وجود branchId لتوليد الكود
    if (!schedule.branchId) {
      return NextResponse.json(
        { error: "الجدول ليس له فرع مرتبط، لا يمكن توليد كود أمر العمل" },
        { status: 400 }
      );
    }

    // 4. توليد الكود والرقم التسلسلي
    const { code, branchSeqNum } = await generateWorkOrderCode(schedule.branchId);

    // 5. إنشاء أمر عمل جماعي واحد
    const today = new Date();
    const workOrder = await prisma.workOrder.create({
      data: {
        title: `${schedule.name} - ${format(today, "yyyy-MM-dd")}`,
        description: `صيانة دورية لـ ${targetAssets.length} أصل (من جدول ${schedule.name})`,
        type: "BULK_PREVENTIVE",
        priorityId: null,
        statusId: null,
        branchId: schedule.branchId,
        companyId,
        createdBy: session.user.id,
        assetTypeId: schedule.assetTypeId,
        code: code,                    // ✅ الكود الفريد
        branchSeqNum: branchSeqNum,    // ✅ الرقم التسلسلي للفرع
        workOrderAssets: {
          create: targetAssets.map((asset: any) => ({
            assetId: asset.id,
            quantity: 1,               // ✅ إضافة الكمية الافتراضية
          })),
        },
      },
      include: { workOrderAssets: true },
    });

    // 6. تحديث `lastRunAt` في جدول الصيانة
    await prisma.maintenanceSchedule.update({
      where: { id: schedule.id },
      data: { lastRunAt: today },
    });

    return NextResponse.json({
      message: `تم إنشاء أمر عمل برقم ${workOrder.code} يتضمن ${targetAssets.length} أصل`,
      workOrderId: workOrder.id,
    });
  } catch (error) {
    console.error("RUN_SCHEDULE_ERROR:", error);
    return NextResponse.json({ error: "فشل تنفيذ الجدول" }, { status: 500 });
  }
}