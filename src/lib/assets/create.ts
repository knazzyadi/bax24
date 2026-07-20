// src/lib/assets/create.ts
import { prisma } from '@/lib/prisma';
import { validateAssetData, normalizeAssetInput } from './validation';
import { generateAssetCode, serializeAsset, type AssetResponse } from './helpers';
import { createAssetAudit } from '@/lib/audit/asset';
import { AuditAction } from '@/lib/audit/types';
import {
  ensureCanCreateAsset,
  ensureBranchAccess,
  ensureCompanyAccess,
  type AuthSession,
} from './permissions';
import { AssetValidationError, AssetBusinessError, handlePrismaError } from './errors';
import type { CreateAssetInput } from './types';

// ============================================================
// إنشاء أصل جديد
// ============================================================

export async function createAsset(
  session: AuthSession,
  input: unknown
): Promise<AssetResponse> {
  try {
    ensureCanCreateAsset(session);

    const normalized = normalizeAssetInput(input as Record<string, unknown>);
    const validated = validateAssetData(normalized);

    // جلب تفاصيل الغرفة
    const room = await prisma.room.findUnique({
      where: { id: validated.roomId },
      include: {
        floor: {
          include: {
            building: {
              select: { id: true, branchId: true, code: true },
            },
          },
        },
      },
    });
    if (!room) {
      throw new AssetValidationError('الغرفة غير موجودة');
    }
    if (!room.floor?.building) {
      throw new AssetValidationError('الغرفة غير مرتبطة بمبنى');
    }

    const branchId = room.floor.building.branchId;
    if (!branchId) {
      throw new AssetValidationError('المبنى غير مرتبط بفرع');
    }

    ensureBranchAccess(session, branchId);
    ensureCompanyAccess(session, session.companyId!);

    // توليد الكود
    const code = await generateAssetCode(
      validated.typeId,
      branchId,
      session.companyId!
    );

    // التحقق من الرقم التسلسلي (إن وجد)
    if (validated.serialNumber) {
      const existing = await prisma.asset.findFirst({
        where: {
          companyId: session.companyId!,
          serialNumber: validated.serialNumber,
          deletedAt: null,
        },
      });
      if (existing) {
        throw new AssetValidationError('الرقم التسلسلي مستخدم بالفعل');
      }
    }

    // إنشاء الأصل
    const asset = await prisma.asset.create({
      data: {
        name: validated.name,
        nameEn: validated.nameEn,
        description: validated.description,
        code,
        serialNumber: validated.serialNumber,
        manufacturer: validated.manufacturer,
        model: validated.model,
        supplierId: validated.supplierId,
        notes: validated.notes,
        typeId: validated.typeId,
        statusId: validated.statusId,
        roomId: validated.roomId,
        buildingId: room.buildingId,
        branchId: branchId,
        companyId: session.companyId!,
        purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : null,
        operationDate: validated.operationDate ? new Date(validated.operationDate) : null,
        warrantyEnd: validated.warrantyEnd ? new Date(validated.warrantyEnd) : null,
        lastMaintenanceDate: validated.lastMaintenanceDate ? new Date(validated.lastMaintenanceDate) : null,
      },
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

    // ✅ تسجيل التدقيق
    await createAssetAudit(
      AuditAction.CREATE,
      asset.id,
      session.userId,
      session.email,
      null,
      asset,
      { createdFrom: input }
    );

    return serializeAsset(asset);
  } catch (error) {
    throw handlePrismaError(error);
  }
}