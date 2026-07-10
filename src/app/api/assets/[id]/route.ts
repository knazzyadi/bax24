// src/app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { createAuditLog, buildAuditDTO, AuditAction } from '@/lib/audit-log';

// ============================================
//  دوال مساعدة (نفس الكود السابق)
// ============================================
async function getAssetBranchId(asset: any): Promise<string | null> {
  if (asset?.room?.floor?.building?.branchId) {
    return asset.room.floor.building.branchId;
  }
  if (asset?.buildingId) {
    const building = await prisma.building.findUnique({
      where: { id: asset.buildingId },
      select: { branchId: true },
    });
    return building?.branchId || null;
  }
  return null;
}

async function validateSerialNumber(
  companyId: string,
  serialNumber: string | null | undefined,
  excludeAssetId?: string
): Promise<boolean> {
  if (!serialNumber) return true;
  const existing = await prisma.asset.findFirst({
    where: {
      companyId,
      serialNumber,
      deletedAt: null,
      ...(excludeAssetId && { id: { not: excludeAssetId } }),
    },
    select: { id: true },
  });
  return !existing;
}

function validateDates(purchaseDate?: Date, operationDate?: Date, warrantyEnd?: Date): void {
  if (purchaseDate && operationDate && operationDate < purchaseDate) {
    throw new Error('تاريخ التشغيل لا يمكن أن يكون قبل تاريخ الشراء');
  }
  if (purchaseDate && warrantyEnd && warrantyEnd < purchaseDate) {
    throw new Error('تاريخ انتهاء الضمان لا يمكن أن يكون قبل تاريخ الشراء');
  }
}

// ============================================
//  GET - جلب أصل واحد (مع تأكيد وجود return)
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // جلب الأصل مع العلاقات
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
                  include: { branch: true },
                },
              },
            },
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
    }

    // التحقق من صلاحية الفرع للمستخدم غير الإداري
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      const assetBranchId = await getAssetBranchId(asset);
      if (!assetBranchId || !userBranchIds.includes(assetBranchId)) {
        return NextResponse.json({ error: 'غير مصرح بالوصول إلى هذا الأصل' }, { status: 403 });
      }
    }

    // تنسيق البيانات (مع الحقول الجديدة)
    const serializedAsset = {
      ...asset,
      description: asset.description ?? null,
      purchaseDate: asset.purchaseDate?.toISOString()?.split('T')[0] || null,
      operationDate: asset.operationDate?.toISOString()?.split('T')[0] || null,
      warrantyEnd: asset.warrantyEnd?.toISOString()?.split('T')[0] || null,
      lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString()?.split('T')[0] || null,
      serialNumber: asset.serialNumber ?? null,
      manufacturer: asset.manufacturer ?? null,
      model: asset.model ?? null,
      supplier: asset.supplier ?? null,
    };

    // ✅ تأكد من إرجاع Response في نهاية الدالة
    return NextResponse.json(serializedAsset);
  } catch (error) {
    console.error('GET /api/assets/[id] error:', error);
    const message = error instanceof Error ? error.message : 'خطأ في الخادم';
    // ✅ تأكد من إرجاع Response في حالة الخطأ
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================
//  PUT - تحديث أصل + تدقيق
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      name,
      nameEn,
      description,
      typeId,
      statusId,
      roomId,
      purchaseDate,
      operationDate,
      warrantyEnd,
      lastMaintenanceDate,
      notes,
      serialNumber,
      manufacturer,
      model,
      supplier,
    } = body;

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // جلب الأصل القديم مع العلاقات
    const existingAsset = await prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        type: true,
        status: true,
        room: {
          include: {
            floor: {
              include: { building: true },
            },
          },
        },
      },
    });

    if (!existingAsset) {
      return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
    }

    // التحقق من الصلاحية
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      const assetBranchId = await getAssetBranchId(existingAsset);
      if (!assetBranchId || !userBranchIds.includes(assetBranchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية تعديل هذا الأصل' }, { status: 403 });
      }
    }

    // معالجة تغيير الغرفة
    let newBuildingId = existingAsset.buildingId;
    let newBranchId = existingAsset.branchId;

    if (roomId && roomId !== existingAsset.roomId) {
      const newRoom = await prisma.room.findFirst({
        where: { id: roomId },
        include: {
          floor: {
            include: { building: true },
          },
        },
      });

      if (!newRoom || newRoom.floor?.building?.companyId !== companyId) {
        return NextResponse.json(
          { error: 'الغرفة غير موجودة أو لا تنتمي للشركة' },
          { status: 400 }
        );
      }

      if (!isAdmin) {
        const userBranchIds = session.branchIds || [];
        const newBranchId = newRoom.floor?.building?.branchId;
        if (!newBranchId || !userBranchIds.includes(newBranchId)) {
          return NextResponse.json(
            { error: 'لا تملك صلاحية نقل الأصل إلى هذه الغرفة' },
            { status: 403 }
          );
        }
      }

      newBuildingId = newRoom.buildingId;
      newBranchId = newRoom.floor?.building?.branchId || existingAsset.branchId;
    }

    // تحويل التواريخ
    const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : undefined;
    const parsedOperationDate = operationDate ? new Date(operationDate) : undefined;
    const parsedWarrantyEnd = warrantyEnd ? new Date(warrantyEnd) : undefined;
    const parsedLastMaintenance = lastMaintenanceDate ? new Date(lastMaintenanceDate) : undefined;

    validateDates(parsedPurchaseDate, parsedOperationDate, parsedWarrantyEnd);

    if (serialNumber) {
      const isUnique = await validateSerialNumber(companyId, serialNumber, id);
      if (!isUnique) {
        return NextResponse.json(
          { error: 'الرقم التسلسلي مستخدم بالفعل في هذه الشركة' },
          { status: 409 }
        );
      }
    }

    // تحديث الأصل مع إرجاع العلاقات
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name: name?.trim(),
        nameEn: nameEn?.trim() || null,
        description: description?.trim() || null,
        typeId: typeId || null,
        statusId: statusId || null,
        purchaseDate: parsedPurchaseDate,
        operationDate: parsedOperationDate,
        warrantyEnd: parsedWarrantyEnd,
        lastMaintenanceDate: parsedLastMaintenance,
        roomId: roomId || null,
        buildingId: newBuildingId,
        branchId: newBranchId,
        notes: notes?.trim() || null,
        serialNumber: serialNumber?.trim() || null,
        manufacturer: manufacturer?.trim() || null,
        model: model?.trim() || null,
        supplier: supplier?.trim() || null,
      },
      include: {
        type: true,
        status: true,
        room: true,
      },
    });

    // ✅ تسجيل التدقيق
    const oldDTO = buildAuditDTO(existingAsset);
    const newDTO = buildAuditDTO(updatedAsset);
    await createAuditLog({
      oldData: oldDTO,
      newData: newDTO,
      userId: session.userId,
      userEmail: session.email,
      metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown' },
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('PUT /api/assets/[id] error:', error);
    const message = error instanceof Error ? error.message : 'خطأ في التحديث';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================
//  DELETE - حذف ناعم + تدقيق
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'لا تملك الصلاحية للحذف' }, { status: 403 });
    }

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // جلب الأصل قبل الحذف
    const existingAsset = await prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { type: true, status: true, room: true },
    });

    if (!existingAsset) {
      return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
    }

    // التحقق من الارتباطات
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

    // حذف ناعم
    const deletedAsset = await prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { type: true, status: true, room: true },
    });

    // ✅ تسجيل الحذف
    const auditDTO = buildAuditDTO(existingAsset);
    await createAuditLog({
      action: AuditAction.DELETE,
      oldData: auditDTO,
      newData: { ...auditDTO, deletedAt: new Date().toISOString() },
      userId: session.userId,
      userEmail: session.email,
      metadata: { ip: request.headers.get('x-forwarded-for') || 'unknown' },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الأصل بنجاح' });
  } catch (error) {
    console.error('DELETE /api/assets/[id] error:', error);
    const message = error instanceof Error ? error.message : 'خطأ في الحذف';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}