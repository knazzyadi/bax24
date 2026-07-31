// src/lib/assets/update.ts
import { prisma } from '@/lib/prisma';
import { validateAssetData, normalizeAssetInput } from './validation';
import { serializeAsset, type AssetResponse } from './helpers';
import { createAssetAudit } from '@/lib/audit/asset';
import { AuditAction } from '@/lib/audit/types';
import { ensureCanEditAsset, ensureAssetAccess, type AuthSession } from './permissions';
import { AssetValidationError, handlePrismaError } from './errors';
import type { Prisma } from '@prisma/client';

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

    // 2. تطبيع وتحقق البيانات
    const normalized = normalizeAssetInput(input as Record<string, unknown>);
    const validated = validateAssetData(normalized);

    // 3. التحقق من الرقم التسلسلي إذا تغير
    if (validated.serialNumber && validated.serialNumber !== oldAsset.serialNumber) {
      const existing = await prisma.asset.findFirst({
        where: {
          companyId: oldAsset.companyId,
          serialNumber: validated.serialNumber,
          deletedAt: null,
          id: { not: assetId },
        },
      });
      if (existing) {
        throw new AssetValidationError('الرقم التسلسلي مستخدم بالفعل');
      }
    }

    // 4. تجهيز بيانات التحديث
    const updateData: Prisma.AssetUpdateInput = {
      name: validated.name,
      nameEn: validated.nameEn,
      description: validated.description,
      serialNumber: validated.serialNumber,
      manufacturer: validated.manufacturer,
      model: validated.model,

      // معالجة علاقة المورد (Supplier)
      ...(validated.supplierId !== undefined && {
        supplier: validated.supplierId
          ? { connect: { id: validated.supplierId } }
          : { disconnect: true },
      }),

      notes: validated.notes,

      // معالجة علاقة النوع (Type)
      ...(validated.typeId !== undefined && {
        type: validated.typeId
          ? { connect: { id: validated.typeId } }
          : { disconnect: true },
      }),

      // معالجة علاقة الحالة (Status)
      ...(validated.statusId !== undefined && {
        status: validated.statusId
          ? { connect: { id: validated.statusId } }
          : { disconnect: true },
      }),

      // معالجة علاقة الغرفة (Room) - التعديل النهائي
      ...(validated.roomId !== undefined && validated.roomId && {
        room: {
          connect: { id: validated.roomId },
        },
      }),

      purchaseDate: validated.purchaseDate
        ? new Date(validated.purchaseDate)
        : null,

      operationDate: validated.operationDate
        ? new Date(validated.operationDate)
        : null,

      warrantyEnd: validated.warrantyEnd
        ? new Date(validated.warrantyEnd)
        : null,

      lastMaintenanceDate: validated.lastMaintenanceDate
        ? new Date(validated.lastMaintenanceDate)
        : null,
    };

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

    // 6. تسجيل التدقيق
    await createAssetAudit(
      AuditAction.UPDATE,
      updatedAsset.id,
      session.userId,
      session.email,
      oldAsset,
      updatedAsset,
      { updatedFrom: input }
    );

    return serializeAsset(updatedAsset);
  } catch (error) {
    throw handlePrismaError(error);
  }
}