// src/app/api/assets/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { getErrorResponse } from '@/lib/assets/errors';
import { generateUniqueAssetCode } from '@/lib/selects/code-generator';

// ============================================================
// POST - إنشاء جماعي (مخصص لاستيراد Excel/CSV)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'معرف الشركة غير متوفر' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { roomId, assets } = body;

    if (!roomId || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة: يجب توفير roomId وقائمة assets' },
        { status: 400 }
      );
    }

    // التحقق من وجود الغرفة والحصول على branchId و buildingId
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        buildingId: true,
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

    const buildingId = room.buildingId;
    if (!buildingId) {
      return NextResponse.json(
        { error: 'الغرفة غير مرتبطة بمبنى' },
        { status: 400 }
      );
    }

    // التحقق من وجود أنواع الأصول قبل البدء
    const typeIds = [...new Set(assets.map(a => a.typeId).filter(Boolean))];
    if (typeIds.length === 0) {
      return NextResponse.json(
        { error: 'يجب تحديد نوع الأصل لجميع الأصول' },
        { status: 400 }
      );
    }

    const existingTypes = await prisma.assetType.findMany({
      where: {
        id: { in: typeIds },
        companyId,
      },
      select: { id: true, code: true },
    });

    const typeMap = new Map(existingTypes.map(t => [t.id, t.code]));
    const missingTypes = typeIds.filter(id => !typeMap.has(id));

    if (missingTypes.length > 0) {
      return NextResponse.json(
        {
          error: `بعض أنواع الأصول غير موجودة: ${missingTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // ✅ استخدام المعاملة مع إحباط عند أول خطأ (ذرية كاملة)
    const result = await prisma.$transaction(async (tx) => {
      const createdAssets = [];

      for (let i = 0; i < assets.length; i++) {
        const assetData = assets[i];

        // التحقق من وجود typeId
        if (!assetData.typeId) {
          throw new Error(`نوع الأصل مطلوب في الصف ${i + 1}`);
        }

        // توليد الكود الفريد
        const code = await generateUniqueAssetCode(
          tx,
          branchId,
          assetData.typeId
        );

        const created = await tx.asset.create({
          data: {
            name: assetData.name?.trim() || 'أصل بدون اسم',
            nameEn: assetData.nameEn?.trim() || null,
            description: assetData.description?.trim() || null,
            code,
            typeId: assetData.typeId,
            statusId: assetData.statusId || null,
            roomId,
            buildingId,
            branchId,
            companyId,
            serialNumber: assetData.serialNumber?.trim() || null,
            manufacturer: assetData.manufacturer?.trim() || null,
            model: assetData.model?.trim() || null,
            supplierId: assetData.supplierId || null,
            notes: assetData.notes?.trim() || null,
            purchaseDate: assetData.purchaseDate ? new Date(assetData.purchaseDate) : null,
            operationDate: assetData.operationDate ? new Date(assetData.operationDate) : null,
            warrantyEnd: assetData.warrantyEnd ? new Date(assetData.warrantyEnd) : null,
            lastMaintenanceDate: assetData.lastMaintenanceDate ? new Date(assetData.lastMaintenanceDate) : null,
          },
        });
        createdAssets.push(created);
      }

      return { createdAssets };
    }, {
      timeout: 60000, // 60 ثانية مهلة للمعاملة
    });

    return NextResponse.json({
      success: true,
      successCount: result.createdAssets.length,
      failCount: 0,
      assets: result.createdAssets,
    });
  } catch (error) {
    console.error('❌ خطأ في الاستيراد الجماعي:', error);
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

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'معرف الشركة غير متوفر' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { assetIds, hard } = body;

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'يجب توفير قائمة معرفات الأصول' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const deletedIds: string[] = [];

      for (const id of assetIds) {
        try {
          const asset = await tx.asset.findUnique({
            where: { id },
            select: { id: true, deletedAt: true, companyId: true },
          });

          if (!asset || asset.deletedAt || asset.companyId !== companyId) {
            continue;
          }

          if (hard) {
            await tx.asset.delete({ where: { id } });
          } else {
            await tx.asset.update({
              where: { id },
              data: { deletedAt: new Date() },
            });
          }
          deletedIds.push(id);
        } catch (err) {
          console.error(`فشل حذف الأصل ${id}:`, err);
          // استمرار الحذف لباقي الأصول
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

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'معرف الشركة غير متوفر' },
        { status: 400 }
      );
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

    const result = await prisma.$transaction(async (tx) => {
      let updatedCount = 0;

      for (const id of assetIds) {
        try {
          const asset = await tx.asset.findUnique({
            where: { id },
            select: { id: true, deletedAt: true, companyId: true },
          });

          if (!asset || asset.deletedAt || asset.companyId !== companyId) {
            continue;
          }

          const { id: _, createdAt, updatedAt, ...updateData } = data;

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
          // استمرار التحديث لباقي الأصول
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