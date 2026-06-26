// src/app/api/maintenance/schedules/route.ts
import { NextRequest, NextResponse } from "next/server";


import { getAuthenticatedSession, checkPermission } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';




// دالة مساعدة لتحويل تردد نصي إلى عدد الأيام
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
      return 30; // القيمة الافتراضية شهر
  }
}

// GET: جلب قائمة جداول الصيانة الوقائية (مع دعم الفلترة والفروع)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await checkPermission("maintenance.read");

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const q = searchParams.get("q") || "";
    const isActive = searchParams.get("isActive");

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    const branchIds = session.user.branchIds || [];

    const where: any = { companyId };

    if (!isAdmin) {
      if (branchIds.length > 0) {
        where.branchId = { in: branchIds };
      } else {
        return NextResponse.json({ items: [], total: 0, currentPage: page, totalPages: 0, limit });
      }
    }

    if (q) {
      where.name = { contains: q, mode: "insensitive" };
    }
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    const [schedules, total] = await Promise.all([
      prisma.maintenanceSchedule.findMany({
        where,
        include: {
          assetType: true,
          branch: true,
          building: true,
          scheduleAssets: { include: { asset: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.maintenanceSchedule.count({ where }),
    ]);

    // ✅ إضافة frequencyDays في الرد
    const serialized = schedules.map((s: any) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      startDate: s.startDate?.toISOString() || null,
      lastRunAt: s.lastRunAt?.toISOString() || null,
      frequencyDays: s.frequencyDays ?? frequencyStringToDays(s.frequency) // احتياطي
    }));

    return NextResponse.json({ items: serialized, total, currentPage: page, totalPages: Math.ceil(total / limit), limit });
  } catch (error) {
    console.error("GET /api/maintenance/schedules error:", error);
    return NextResponse.json({ error: "خطأ في جلب الجداول" }, { status: 500 });
  }
}

// POST: إنشاء جدول صيانة جديد
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await checkPermission("maintenance.create");

    const body = await request.json();
    const {
      name,
      frequency,        // قد يكون نصياً (للتوافق القديم)
      frequencyDays,   // العدد الجديد (أيام)
      leadDays,
      startDate,
      branchId,
      buildingId,
      assetTypeId,
      assetIds,
      isActive,
      notes,
    } = body;

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "لا توجد شركة مرتبطة" }, { status: 400 });
    }

    // التحقق من صحة النطاق
    if (branchId && buildingId) {
      const building = await prisma.building.findFirst({ where: { id: buildingId, branchId } });
      if (!building) {
        return NextResponse.json({ error: "المبنى لا ينتمي إلى الفرع المحدد" }, { status: 400 });
      }
    }

    // تحديد عدد الأيام: الأولوية لـ frequencyDays، ثم تحويل frequency النصي
    let finalFrequencyDays: number | null = null;
    if (frequencyDays !== undefined && typeof frequencyDays === 'number') {
      finalFrequencyDays = frequencyDays;
    } else if (frequency) {
      finalFrequencyDays = frequencyStringToDays(frequency);
    } else {
      finalFrequencyDays = 30; // القيمة الافتراضية
    }

    const scheduleData: any = {
      name,
      frequency: frequency || "monthly",   // نحتفظ بالحقل النصي للتوافق القديم (يمكن حذفه لاحقاً)
      frequencyDays: finalFrequencyDays,
      leadDays: leadDays || 30,
      startDate: startDate ? new Date(startDate) : null,
      branchId: branchId || null,
      buildingId: buildingId || null,
      assetTypeId: assetTypeId || null,
      companyId,
      isActive: isActive !== undefined ? isActive : true,
      notes: notes || null,
    };

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        ...scheduleData,
        scheduleAssets: assetIds && assetIds.length ? { create: assetIds.map((assetId: string) => ({ assetId })) } : undefined,
      },
      include: { scheduleAssets: { include: { asset: true } } },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("POST /api/maintenance/schedules error:", error);
    return NextResponse.json({ error: "فشل إنشاء الجدول" }, { status: 500 });
  }
}