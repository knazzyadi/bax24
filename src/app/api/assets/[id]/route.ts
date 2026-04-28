// src/app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await requirePermission('assets.read', session);

    const { id } = await params;
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const asset = await prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        type: true,
        status: true,
        room: {
          include: {
            floor: {
              include: {
                building: {
                  include: { branch: true }
                }
              }
            }
          }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.user.branchIds || [];
      let assetBranchId: string | null = null;
      if (asset.room?.floor?.building?.branchId) {
        assetBranchId = asset.room.floor.building.branchId;
      } else if (asset.buildingId) {
        const building = await prisma.building.findUnique({
          where: { id: asset.buildingId },
          select: { branchId: true }
        });
        assetBranchId = building?.branchId || null;
      }
      if (!assetBranchId || !userBranchIds.includes(assetBranchId)) {
        return NextResponse.json({ error: 'غير مصرح بالوصول إلى هذا الأصل' }, { status: 403 });
      }
    }

    const serializedAsset = {
      ...asset,
      purchaseDate: asset.purchaseDate?.toISOString()?.split('T')[0] || null,
      warrantyEnd: asset.warrantyEnd?.toISOString()?.split('T')[0] || null,
    };
    return NextResponse.json(serializedAsset);
  } catch (error: any) {
    console.error('GET /api/assets/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم', details: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, nameEn, typeId, statusId, purchaseDate, warrantyEnd, roomId, notes } = body;
    const companyId = session.user.companyId!;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

    // جلب الأصل الحالي للتحقق من الصلاحية
    const existingAsset = await prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        room: {
          include: {
            floor: {
              include: { building: true }
            }
          }
        }
      }
    });
    if (!existingAsset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });

    // التحقق من صلاحية الفرع للمستخدم غير الأدمن
    if (!isAdmin) {
      const userBranchIds = session.user.branchIds || [];
      let assetBranchId: string | null = null;
      if (existingAsset.room?.floor?.building?.branchId) {
        assetBranchId = existingAsset.room.floor.building.branchId;
      } else if (existingAsset.buildingId) {
        const building = await prisma.building.findUnique({
          where: { id: existingAsset.buildingId },
          select: { branchId: true }
        });
        assetBranchId = building?.branchId || null;
      }
      if (!assetBranchId || !userBranchIds.includes(assetBranchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية تعديل هذا الأصل' }, { status: 403 });
      }
    }

    // إذا تم تغيير الغرفة، تحقق من صلاحية الغرفة الجديدة
    let newBuildingId = existingAsset.buildingId;
    if (roomId && roomId !== existingAsset.roomId) {
      const newRoom = await prisma.room.findFirst({
        where: { id: roomId, floor: { building: { companyId } } },
        include: { floor: { include: { building: true } } }
      });
      if (!newRoom) return NextResponse.json({ error: 'الغرفة غير موجودة أو لا تنتمي للشركة' }, { status: 400 });
      if (!isAdmin) {
        const userBranchIds = session.user.branchIds || [];
        const newBranchId = newRoom.floor?.building?.branchId;
        if (!newBranchId || !userBranchIds.includes(newBranchId)) {
          return NextResponse.json({ error: 'لا تملك صلاحية نقل الأصل إلى هذه الغرفة' }, { status: 403 });
        }
      }
      newBuildingId = newRoom.buildingId;
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name: name?.trim(),
        nameEn: nameEn?.trim() || null,
        typeId: typeId || null,
        statusId: statusId || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
        roomId: roomId || null,
        buildingId: newBuildingId,
        notes: notes?.trim() || null,
      },
    });
    return NextResponse.json(updatedAsset);
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'خطأ في التحديث' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) return NextResponse.json({ error: 'لا تملك الصلاحية للحذف' }, { status: 403 });

    const { id } = await params;
    const companyId = session.user.companyId!;
    const existingAsset = await prisma.asset.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!existingAsset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });

    // التحقق من وجود ارتباطات بأوامر العمل (WorkOrderAsset)
    const workOrderAsset = await prisma.workOrderAsset.findFirst({
      where: { assetId: id },
      select: { workOrderId: true }
    });
    if (workOrderAsset) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الأصل لأنه مرتبط بأمر عمل. قم بإزالة الارتباط أولاً.' },
        { status: 409 }
      );
    }

    // التحقق من وجود ارتباطات بجداول الصيانة الدورية (ScheduleAsset)
    const scheduleAsset = await prisma.scheduleAsset.findFirst({
      where: { assetId: id },
      select: { scheduleId: true }
    });
    if (scheduleAsset) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الأصل لأنه مرتبط بجدول صيانة دورية.' },
        { status: 409 }
      );
    }

    // التحقق من وجود ارتباطات بتذاكر (بلاغات)
    const ticket = await prisma.ticket.findFirst({
      where: { assetId: id, deletedAt: null },
      select: { id: true }
    });
    if (ticket) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الأصل لأنه مرتبط بتذكرة (بلاغ).' },
        { status: 409 }
      );
    }

    // تنفيذ الحذف الناعم
    await prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'خطأ في الحذف' }, { status: 500 });
  }
}