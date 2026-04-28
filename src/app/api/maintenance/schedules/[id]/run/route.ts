import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { addDays, format as formatDate } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("maintenance.execute", session);

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

    // 2. تحديد الأصول المستهدفة (أصول محددة أو حسب النطاق ونوع الأصل)
    let targetAssets: any[] = [];
    if (schedule.scheduleAssets.length > 0) {
      targetAssets = schedule.scheduleAssets.map(sa => sa.asset);
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

    // 3. إنشاء أمر عمل جماعي واحد
    const today = new Date();
    const workOrder = await prisma.workOrder.create({
      data: {
        title: `${schedule.name} - ${formatDate(today, "yyyy-MM-dd")}`,
        description: `صيانة دورية لـ ${targetAssets.length} أصل (من جدول ${schedule.name})`,
        type: "BULK_PREVENTIVE",
        priorityId: null,
        statusId: null,
        branchId: schedule.branchId,
        companyId,
        createdBy: session.user.id,
        assetTypeId: schedule.assetTypeId,
        workOrderAssets: {
          create: targetAssets.map(asset => ({ assetId: asset.id })),
        },
      },
      include: { workOrderAssets: true },
    });

    // 4. تحديث `lastRunAt` في جدول الصيانة
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