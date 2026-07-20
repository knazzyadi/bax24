// src/app/api/maintenance/schedules/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, requirePermission } from '@/lib/auth/auth-helper'; // ✅
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('maintenance.read'); // ✅

    const { id } = await params;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بالمستخدم' },
        { status: 400 }
      );
    }

    const schedule = await prisma.maintenanceSchedule.findFirst({
      where: { 
        id, 
        companyId,
      },
      include: {
        assetType: true,
        branch: true,
        building: true,
        scheduleAssets: {
          include: { asset: true },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'جدول الصيانة غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error('GET /api/maintenance/schedules/[id] error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('maintenance.update'); // ✅

    const { id } = await params;
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
      nameEn,
      frequency,
      leadDays,
      assetTypeId,
      branchId,
      buildingId,
      isActive,
    } = body;

    const existing = await prisma.maintenanceSchedule.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'جدول الصيانة غير موجود' },
        { status: 404 }
      );
    }

    const updated = await prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        name,
        frequency,
        leadDays,
        assetTypeId,
        branchId,
        buildingId,
        isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/maintenance/schedules/[id] error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('maintenance.delete'); // ✅

    const { id } = await params;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بالمستخدم' },
        { status: 400 }
      );
    }

    const existing = await prisma.maintenanceSchedule.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'جدول الصيانة غير موجود' },
        { status: 404 }
      );
    }

    await prisma.maintenanceSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'تم حذف جدول الصيانة بنجاح' });
  } catch (error: any) {
    console.error('DELETE /api/maintenance/schedules/[id] error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}