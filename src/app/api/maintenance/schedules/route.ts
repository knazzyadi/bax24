// src/app/api/maintenance/schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

// GET: جلب قائمة جداول الصيانة الوقائية (مع دعم الفلترة والفروع)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("maintenance.read", session);

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

    // ✅ إضافة نوع صريح للمعامل s
    const serialized = schedules.map((s: any) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      startDate: s.startDate?.toISOString() || null,
      lastRunAt: s.lastRunAt?.toISOString() || null,
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    await requirePermission("maintenance.create", session);

    const body = await request.json();
    const {
      name,
      frequency,
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

    const scheduleData: any = {
      name,
      frequency,
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