// src/lib/assets/create.ts
import { prisma } from '@/lib/prisma';
import { validateAssetData, normalizeAssetInput } from './validation';
import { serializeAsset, type AssetResponse } from './helpers';
import { generateUniqueAssetCode } from '@/lib/selects/code-generator';
import { createAssetAudit } from '@/lib/audit/asset';
import { AuditAction } from '@/lib/audit/types';
import {
  ensureCanCreateAsset,
  ensureBranchAccess,
  ensureCompanyAccess,
  type AuthSession,
} from './permissions';
import { AssetValidationError, handlePrismaError } from './errors';

// ============================================================
// إنشاء أصل جديد (باستخدام معاملة ذرية)
// ============================================================

export async function createAsset(
  session: AuthSession,
  input: unknown
): Promise<AssetResponse> {
  try {
    ensureCanCreateAsset(session);

    const normalized = normalizeAssetInput(input as Record<string, unknown>);
    const validated = validateAssetData(normalized);

    // 1. جلب تفاصيل الغرفة (قراءة فقط، خارج المعاملة)
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

    // 2. التحقق من الرقم التسلسلي (قراءة فقط، خارج المعاملة)
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

    // 3. المعاملة الذرية: جلب الرموز + توليد الكود + إنشاء الأصل
    const asset = await prisma.$transaction(
      async (tx) => {
        // جلب رمز الفرع ونوع الأصل داخل المعاملة
        const [branch, assetType] = await Promise.all([
          tx.branch.findUnique({
            where: { id: branchId },
            select: { code: true },
          }),
          tx.assetType.findUnique({
            where: { id: validated.typeId },
            select: { code: true },
          }),
        ]);

        if (!branch?.code) {
          throw new Error('الفرع غير موجود أو لا يحتوي على رمز');
        }
        if (!assetType?.code) {
          throw new Error('نوع الأصل غير موجود أو لا يحتوي على رمز');
        }

        const code = await generateUniqueAssetCode(
          tx,
          branchId,
          validated.typeId,
          branch.code,
          assetType.code
        );

        return tx.asset.create({
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
      },
      {
        timeout: 15000,
        maxWait: 5000,
      }
    );

    // 4. تسجيل التدقيق (خارج المعاملة - قراءة فقط)
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