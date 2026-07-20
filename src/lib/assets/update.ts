// src/lib/assets/update.ts
import { prisma } from '@/lib/prisma';
import { validateAssetData, normalizeAssetInput } from './validation';
import { serializeAsset, type AssetResponse } from './helpers';
import { createAssetAudit } from '@/lib/audit/asset';
import { AuditAction } from '@/lib/audit/types';
import { ensureCanEditAsset, ensureAssetAccess, type AuthSession } from './permissions';
import { AssetValidationError, handlePrismaError } from './errors';
import type { UpdateAssetInput } from './types';

export async function updateAsset(
  session: AuthSession,
  assetId: string,
  input: unknown
): Promise<AssetResponse> {
  try {
    ensureCanEditAsset(session);
    await ensureAssetAccess(session, assetId);

    // 1. جلب الأصل القديم
    const oldAsset = await prisma.asset.findUnique({
      where: { id: assetId, deletedAt: null },
      include: {
        type: true,
        status: true,
        supplier: true,
        room: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    branch: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!oldAsset) {
      throw new AssetValidationError('الأصل غير موجود');
    }

    // 2. تنظيف المدخلات والتحقق
    const normalized = normalizeAssetInput(input as Record<string, unknown>);
    const validated = validateAssetData(normalized);

    // 3. بناء بيانات التحديث
    const updateData: Record<string, unknown> = {};
    const fields: (keyof typeof validated)[] = [
      'name',
      'nameEn',
      'description',
      'serialNumber',
      'manufacturer',
      'model',
      'supplierId',
      'typeId',
      'statusId',
      'roomId',
      'notes',
    ];
    for (const field of fields) {
      if (validated[field] !== undefined) {
        updateData[field] = validated[field];
      }
    }
    // معالجة التواريخ
    if (validated.purchaseDate !== undefined) {
      updateData.purchaseDate = validated.purchaseDate ? new Date(validated.purchaseDate) : null;
    }
    if (validated.operationDate !== undefined) {
      updateData.operationDate = validated.operationDate ? new Date(validated.operationDate) : null;
    }
    if (validated.warrantyEnd !== undefined) {
      updateData.warrantyEnd = validated.warrantyEnd ? new Date(validated.warrantyEnd) : null;
    }
    if (validated.lastMaintenanceDate !== undefined) {
      updateData.lastMaintenanceDate = validated.lastMaintenanceDate ? new Date(validated.lastMaintenanceDate) : null;
    }

    // 4. إذا لم توجد تغييرات، نعيد الأصل دون تحديث
    if (Object.keys(updateData).length === 0) {
      return serializeAsset(oldAsset);
    }

    // 5. تحديث الأصل
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: updateData,
      include: {
        type: true,
        status: true,
        supplier: true,
        room: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    branch: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 6. تسجيل التدقيق باستخدام النظام الجديد
    await createAssetAudit(
      AuditAction.UPDATE,
      assetId,
      session.userId,
      session.email,
      oldAsset,
      updatedAsset,
      { updatedFields: Object.keys(updateData) }
    );

    return serializeAsset(updatedAsset);
  } catch (error) {
    throw handlePrismaError(error);
  }
}