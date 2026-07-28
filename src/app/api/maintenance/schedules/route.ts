// src/app/api/maintenance/schedules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, requirePermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET: جلب قائمة جداول الصيانة
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('maintenance.read');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بالمستخدم' },
        { status: 400 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [schedules, total] = await Promise.all([
      prisma.maintenanceSchedule.findMany({
        where: { companyId },
        include: {
          assetType: true,
          branch: true,
          building: true,
          floor: true,
          room: true,
          scheduleAssets: {
            include: {
              asset: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.maintenanceSchedule.count({
        where: { companyId },
      }),
    ]);

    return NextResponse.json({
      data: schedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('GET /api/maintenance/schedules error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: إنشاء جدول صيانة جديد
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('maintenance.create');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بالمستخدم' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      name,
      frequency,
      frequencyDays,
      leadDays,
      startDate,
      notes,
      isActive,
      assetTypeId,
      branchId,
      buildingId,
      floorId,
      roomId,
      assetIds,
    } = body;

    // ===== التحقق من البيانات المطلوبة =====
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'اسم الجدول مطلوب' },
        { status: 400 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { error: 'الفرع مطلوب' },
        { status: 400 }
      );
    }

    if (!buildingId && !floorId && !roomId) {
      return NextResponse.json(
        { error: 'يجب تحديد موقع الصيانة' },
        { status: 400 }
      );
    }

    // ===== ✅ التحقق من صحة نوع الأصل (إن وجد) =====
    if (assetTypeId) {
      const assetTypeExists = await prisma.assetType.findFirst({
        where: {
          id: assetTypeId,
          companyId,
        },
      });
      if (!assetTypeExists) {
        return NextResponse.json(
          { error: 'نوع الأصل غير صالح أو لا ينتمي للشركة' },
          { status: 400 }
        );
      }
    }

    // ===== ✅ التحقق من صحة الأصول (إن وجدت) =====
    if (Array.isArray(assetIds) && assetIds.length > 0) {
      const validAssetsCount = await prisma.asset.count({
        where: {
          id: { in: assetIds },
          companyId,
        },
      });

      if (validAssetsCount !== assetIds.length) {
        return NextResponse.json(
          { error: 'بعض الأصول غير صالحة أو لا تنتمي للشركة' },
          { status: 400 }
        );
      }
    }

    // ===== تحديد المستوى الفعلي للموقع =====
    let finalLocationLevel = "building";
    if (roomId) {
      finalLocationLevel = "room";
    } else if (floorId) {
      finalLocationLevel = "floor";
    }

    // ===== إنشاء الجدول =====
    const newSchedule = await prisma.maintenanceSchedule.create({
      data: {
        name: name.trim(),
        frequency,
        frequencyDays: frequencyDays || 30,
        leadDays: leadDays || 30,
        startDate: startDate ? new Date(startDate) : null,
        notes: notes || null,
        isActive: isActive ?? true,
        assetTypeId: assetTypeId || null,
        branchId: branchId || null,
        buildingId: buildingId || null,
        floorId: floorId || null,
        roomId: roomId || null,
        locationLevel: finalLocationLevel,
        companyId,
        scheduleAssets: {
          create: Array.isArray(assetIds)
            ? assetIds.map((assetId: string) => ({
                assetId,
              }))
            : [],
        },
      },
      include: {
        branch: true,
        building: true,
        floor: true,
        room: true,
        assetType: true,
        scheduleAssets: {
          include: { asset: true },
        },
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/maintenance/schedules error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}