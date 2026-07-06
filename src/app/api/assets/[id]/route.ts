// src/app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ✅ GET: جلب أصل واحد مع صلاحيات
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. التحقق من المصادقة
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // 2. جلب الأصل مع علاقاته
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

    // 3. التحقق من الصلاحية (الإداري يمر مباشرة، العادي يحتاج فرع)
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    const isAdmin = allowedRoles.includes(session.role);

    if (!isAdmin) {
      // المستخدم العادي: يجب أن يكون في نفس الفرع
      const userBranchIds = session.branchIds || [];
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

    // 4. إرجاع البيانات مع تنسيق التواريخ
    const serializedAsset = {
      ...asset,
      description: asset.description ?? null,
      descriptionEn: asset.descriptionEn ?? null,
      purchaseDate: asset.purchaseDate?.toISOString()?.split('T')[0] || null,
      warrantyEnd: asset.warrantyEnd?.toISOString()?.split('T')[0] || null,
      lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString()?.split('T')[0] || null,
    };

    return NextResponse.json(serializedAsset);
  } catch (error: any) {
    console.error('GET /api/assets/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// ✅ PUT: تحديث أصل
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. المصادقة
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, nameEn, description, descriptionEn, typeId, statusId, purchaseDate, warrantyEnd, lastMaintenanceDate, roomId, notes } = body;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // 2. التأكد من وجود الأصل
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
    if (!existingAsset) {
      return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
    }

    // 3. صلاحيات التعديل
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    const isAdmin = allowedRoles.includes(session.role);

    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
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

    // 4. معالجة تغيير الغرفة (وتحديث buildingId)
    let newBuildingId = existingAsset.buildingId;
    if (roomId && roomId !== existingAsset.roomId) {
      const newRoom = await prisma.room.findFirst({
        where: { id: roomId, floor: { building: { companyId } } },
        include: { floor: { include: { building: true } } }
      });
      if (!newRoom) {
        return NextResponse.json({ error: 'الغرفة غير موجودة أو لا تنتمي للشركة' }, { status: 400 });
      }
      if (!isAdmin) {
        const userBranchIds = session.branchIds || [];
        const newBranchId = newRoom.floor?.building?.branchId;
        if (!newBranchId || !userBranchIds.includes(newBranchId)) {
          return NextResponse.json({ error: 'لا تملك صلاحية نقل الأصل إلى هذه الغرفة' }, { status: 403 });
        }
      }
      newBuildingId = newRoom.buildingId;
    }

    // 5. تحديث البيانات
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name: name?.trim(),
        nameEn: nameEn?.trim() || null,
        description: description?.trim() || null,
        descriptionEn: descriptionEn?.trim() || null,
        typeId: typeId || null,
        statusId: statusId || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        roomId: roomId || null,
        buildingId: newBuildingId,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(updatedAsset);
  } catch (error: any) {
    console.error('PUT /api/assets/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في التحديث' }, { status: 500 });
  }
}

// ✅ DELETE: حذف أصل (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. المصادقة
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 2. فقط الإداريون يمكنهم الحذف
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'لا تملك الصلاحية للحذف' }, { status: 403 });
    }

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // 3. التأكد من وجود الأصل
    const existingAsset = await prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null }
    });
    if (!existingAsset) {
      return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
    }

    // 4. التحقق من وجود ارتباطات تمنع الحذف
    const [workOrderAsset, ticket, scheduleAsset] = await Promise.all([
      prisma.workOrderAsset.findFirst({ where: { assetId: id }, select: { workOrderId: true } }),
      prisma.ticket.findFirst({ where: { assetId: id, deletedAt: null }, select: { id: true } }),
      prisma.scheduleAsset.findFirst({ where: { assetId: id }, select: { scheduleId: true } }),
    ]);

    const relations: string[] = [];
    if (workOrderAsset) relations.push('أمر عمل (Work Order)');
    if (ticket) relations.push('تذكرة (Ticket)');
    if (scheduleAsset) relations.push('جدول صيانة (Maintenance Schedule)');

    if (relations.length > 0) {
      const errorMessage = `لا يمكن حذف الأصل لأنه مرتبط بـ: ${relations.join('، ')}. يرجى حذف هذه العناصر أولاً.`;
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }

    // 5. حذف ناعم (soft delete)
    await prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/assets/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في الحذف' }, { status: 500 });
  }
}