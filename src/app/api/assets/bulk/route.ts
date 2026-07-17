// src/app/api/assets/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { getErrorResponse } from '@/lib/assets/errors';

// ============================================================
// POST - إنشاء جماعي (مخصص لاستيراد Excel/CSV)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, assets } = body;

    if (!roomId || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة: يجب توفير roomId وقائمة assets' },
        { status: 400 }
      );
    }

    // ✅ التحقق من وجود الغرفة والحصول على branchId و buildingId
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        buildingId: true, // ✅ إضافة buildingId
        building: {
          select: {
            branchId: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    const branchId = room.building?.branchId;
    if (!branchId) {
      return NextResponse.json(
        { error: 'الغرفة غير مرتبطة بفرع' },
        { status: 400 }
      );
    }

    // ✅ استخراج buildingId من الغرفة
    const buildingId = room.buildingId;
    if (!buildingId) {
      return NextResponse.json(
        { error: 'الغرفة غير مرتبطة بمبنى' },
        { status: 400 }
      );
    }

    // استخدام المعاملة لإنشاء الأصول بشكل جماعي
    const result = await prisma.$transaction(async (tx) => {
      const createdAssets = [];
      const errors: { index: number; error: string }[] = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        try {
          // توليد كود فريد (يمكن تحسينه حسب منطق المشروع)
          const code = `AST-${Date.now()}-${i}`;

          // ✅ إنشاء الأصل مع إضافة buildingId
          const created = await tx.asset.create({
            data: {
              name: asset.name || 'أصل بدون اسم',
              code,
              typeId: asset.typeId || null,
              statusId: asset.statusId || null,
              roomId,
              buildingId, // ✅ تمت الإضافة
              branchId,
              companyId: session.companyId,
              serialNumber: asset.serialNumber || null,
              manufacturer: asset.manufacturer || null,
              model: asset.model || null,
              supplierId: asset.supplierId || null,
              notes: asset.notes || null,
              purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
              operationDate: asset.operationDate ? new Date(asset.operationDate) : null,
              warrantyEnd: asset.warrantyEnd ? new Date(asset.warrantyEnd) : null,
              lastMaintenanceDate: asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate) : null,
            },
          });
          createdAssets.push(created);
        } catch (err) {
          // معالجة الخطأ من نوع unknown
          const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
          errors.push({ index: i, error: errorMessage });
        }
      }

      return { createdAssets, errors };
    });

    return NextResponse.json({
      success: true,
      successCount: result.createdAssets.length,
      failCount: result.errors.length,
      errors: result.errors,
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

// ============================================================
// DELETE - حذف جماعي
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { assetIds, hard } = body;

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'يجب توفير قائمة معرفات الأصول' },
        { status: 400 }
      );
    }

    // تنفيذ الحذف الجماعي مباشرة
    const result = await prisma.$transaction(async (tx) => {
      const deletedIds: string[] = [];

      for (const id of assetIds) {
        try {
          // التحقق من وجود الأصل
          const asset = await tx.asset.findUnique({
            where: { id },
            select: { id: true, deletedAt: true },
          });

          if (!asset) {
            continue; // الأصل غير موجود، نتجاوزه
          }

          if (hard) {
            // حذف صلب
            await tx.asset.delete({ where: { id } });
          } else {
            // حذف ناعم
            await tx.asset.update({
              where: { id },
              data: { deletedAt: new Date() },
            });
          }
          deletedIds.push(id);
        } catch (err) {
          // تجاهل الأخطاء الفردية لتكملة الحذف الجماعي
          console.error(`فشل حذف الأصل ${id}:`, err);
        }
      }

      return { deletedCount: deletedIds.length, deletedIds };
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      deletedIds: result.deletedIds,
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

// ============================================================
// PUT - تحديث جماعي
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { assetIds, data } = body;

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'يجب توفير قائمة معرفات الأصول' },
        { status: 400 }
      );
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'يجب توفير بيانات التحديث' },
        { status: 400 }
      );
    }

    // تنفيذ التحديث الجماعي
    const result = await prisma.$transaction(async (tx) => {
      let updatedCount = 0;

      for (const id of assetIds) {
        try {
          // التحقق من وجود الأصل
          const asset = await tx.asset.findUnique({
            where: { id },
            select: { id: true, deletedAt: true },
          });

          if (!asset || asset.deletedAt) {
            continue;
          }

          // إزالة الحقول غير القابلة للتحديث
          const { id: _, createdAt, updatedAt, ...updateData } = data;

          // تحويل التواريخ إذا كانت موجودة
          if (updateData.purchaseDate) {
            updateData.purchaseDate = new Date(updateData.purchaseDate);
          }
          if (updateData.operationDate) {
            updateData.operationDate = new Date(updateData.operationDate);
          }
          if (updateData.warrantyEnd) {
            updateData.warrantyEnd = new Date(updateData.warrantyEnd);
          }
          if (updateData.lastMaintenanceDate) {
            updateData.lastMaintenanceDate = new Date(updateData.lastMaintenanceDate);
          }

          await tx.asset.update({
            where: { id },
            data: updateData,
          });
          updatedCount++;
        } catch (err) {
          console.error(`فشل تحديث الأصل ${id}:`, err);
        }
      }

      return { updatedCount };
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}