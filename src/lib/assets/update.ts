// src/lib/assets/update.ts

import { prisma } from '@/lib/prisma';
import { validateAssetData, normalizeAssetInput } from './validation';
import { serializeAsset, type AssetResponse } from './helpers';
import { buildDiff, createAuditLog } from './audit';
import { ensureCanEditAsset, ensureAssetAccess, type AuthSession } from './permissions';
import { AssetValidationError, handlePrismaError } from './errors';
import type { UpdateAssetInput } from './types';

// ✅ جميع الحقول القابلة للتعديل
const COMPARABLE_FIELDS = [
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
  'purchaseDate',
  'operationDate',
  'warrantyEnd',
  'lastMaintenanceDate',
  'notes',
] as const;

export async function updateAsset(
  session: AuthSession,
  assetId: string,
  input: unknown
): Promise<AssetResponse> {
  try {
    console.log('🔄 Starting updateAsset for:', assetId);

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
    console.log('📦 Old asset fetched:', oldAsset.id);

    // 2. تنظيف المدخلات
    const normalized = normalizeAssetInput(input as Record<string, unknown>);
    const validated = validateAssetData(normalized);
    console.log('📝 Validated input:', validated);

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

    console.log('📦 Update data:', updateData);

    // 4. إذا لم توجد تغييرات، نعيد الأصل دون تحديث
    if (Object.keys(updateData).length === 0) {
      console.log('⚠️ No update data, returning old asset');
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
    console.log('✅ Asset updated successfully');

    // 6. حساب الفروقات
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const field of COMPARABLE_FIELDS) {
      const oldVal = oldAsset[field as keyof typeof oldAsset];
      const newVal = updatedAsset[field as keyof typeof updatedAsset];
      
      // تحويل التواريخ إلى نصوص للمقارنة
      const oldStr = oldVal instanceof Date ? oldVal.toISOString() : oldVal;
      const newStr = newVal instanceof Date ? newVal.toISOString() : newVal;
      
      if (JSON.stringify(oldStr) !== JSON.stringify(newStr)) {
        changes[field] = { old: oldStr, new: newStr };
      }
    }

    console.log('📊 Changes detected:', changes);

    // 7. تسجيل التدقيق
    if (Object.keys(changes).length > 0) {
      console.log('📝 Creating audit log...');
      await createAuditLog(
        session.userId,
        assetId,
        'UPDATE',
        changes,
        { updatedFields: Object.keys(updateData) }
      );
      console.log('✅ Audit log created successfully');
    } else {
      console.log('⚠️ No changes detected, skipping audit log');
    }

    return serializeAsset(updatedAsset);
  } catch (error) {
    console.error('❌ Error in updateAsset:', error);
    throw handlePrismaError(error);
  }
}