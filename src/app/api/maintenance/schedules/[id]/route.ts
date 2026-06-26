// src/app/api/maintenance/schedules/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedSession, checkPermission } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';




export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await checkPermission('maintenance.read');

    const { id } = await params;
    const companyId = session.user.companyId;

    // ✅ التحقق من وجود companyId
    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بالمستخدم' },
        { status: 400 }
      );
    }

    const schedule = await prisma.maintenanceSchedule.findFirst({
      where: { 
        id, 
        companyId,  // الآن companyId مضمون أنه string
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
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await checkPermission('maintenance.update');

    const { id } = await params;
    const companyId = session.user.companyId;

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

    // التحقق من وجود الجدول
    const existing = await prisma.maintenanceSchedule.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'جدول الصيانة غير موجود' },
        { status: 404 }
      );
    }

    // تحديث الجدول
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
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await checkPermission('maintenance.delete');

    const { id } = await params;
    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بالمستخدم' },
        { status: 400 }
      );
    }

    // التحقق من وجود الجدول
    const existing = await prisma.maintenanceSchedule.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'جدول الصيانة غير موجود' },
        { status: 404 }
      );
    }

    // حذف الجدول (أو يمكنك استخدام soft delete إذا كان لديك حقل deletedAt)
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