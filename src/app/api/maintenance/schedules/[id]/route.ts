import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

// دالة مساعدة لتحويل تردد نصي إلى عدد الأيام (نفس الموجودة في route.ts)
function frequencyStringToDays(freq: string): number {
  switch (freq.toLowerCase()) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    case 'quarterly':
      return 90;
    case 'yearly':
      return 365;
    default:
      return 30;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    await requirePermission("maintenance.read", session);

    const { id } = await params;
    const companyId = session.user.companyId;
    const schedule = await prisma.maintenanceSchedule.findFirst({
      where: { id, companyId },
      include: {
        assetType: true,
        branch: true,
        building: true,
        scheduleAssets: { include: { asset: true } },
      },
    });
    if (!schedule) return NextResponse.json({ error: "الجدول غير موجود" }, { status: 404 });
    return NextResponse.json(schedule);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في جلب الجدول" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    await requirePermission("maintenance.update", session);

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      frequency,        // نصي (اختياري للتوافق)
      frequencyDays,    // العدد الجديد (أيام)
      leadDays,
      startDate,
      branchId,
      buildingId,
      assetTypeId,
      assetIds,
      notes,
      isActive,
    } = body;

    const companyId = session.user.companyId;

    const existing = await prisma.maintenanceSchedule.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "الجدول غير موجود" }, { status: 404 });

    // حساب frequencyDays النهائي (الأولوية للقيم الجديدة)
    let finalFrequencyDays: number | null = null;
    if (frequencyDays !== undefined && typeof frequencyDays === 'number') {
      finalFrequencyDays = frequencyDays;
    } else if (frequency) {
      finalFrequencyDays = frequencyStringToDays(frequency);
    } else if (existing.frequencyDays) {
      finalFrequencyDays = existing.frequencyDays;
    } else {
      finalFrequencyDays = frequencyStringToDays(existing.frequency);
    }

    // بناء بيانات التحديث الأساسية
    const updateData: any = {
      name,
      frequency: frequency || existing.frequency,  // نحتفظ بالنص القديم
      frequencyDays: finalFrequencyDays,
      leadDays,
      startDate: startDate ? new Date(startDate) : null,
      notes: notes || null,
      isActive,
    };

    // تحديث العلاقات باستخدام connect/disconnect
    if (branchId !== undefined) {
      updateData.branch = branchId ? { connect: { id: branchId } } : { disconnect: true };
    }
    if (buildingId !== undefined) {
      updateData.building = buildingId ? { connect: { id: buildingId } } : { disconnect: true };
    }
    if (assetTypeId !== undefined) {
      updateData.assetType = assetTypeId ? { connect: { id: assetTypeId } } : { disconnect: true };
    }

    // تحديث الأصول المحددة
    let updateAssets = undefined;
    if (assetIds !== undefined) {
      updateAssets = {
        deleteMany: {},
        create: assetIds.map((assetId: string) => ({ assetId })),
      };
    }

    const updated = await prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        ...updateData,
        scheduleAssets: updateAssets,
      },
      include: { scheduleAssets: { include: { asset: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "فشل تحديث الجدول" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    await requirePermission("maintenance.delete", session);

    const { id } = await params;
    const companyId = session.user.companyId;
    const existing = await prisma.maintenanceSchedule.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "الجدول غير موجود" }, { status: 404 });
    await prisma.maintenanceSchedule.delete({ where: { id } });
    return NextResponse.json({ message: "تم حذف الجدول" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل حذف الجدول" }, { status: 500 });
  }
}