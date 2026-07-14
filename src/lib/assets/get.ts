// src/lib/assets/get.ts

import { prisma } from '@/lib/prisma';
import { serializeAsset, type AssetResponse } from './helpers';
import { ensureAssetAccess, ensureCanViewAsset, type AuthSession } from './permissions';
import { AssetNotFoundError, handlePrismaError } from './errors';

const assetDetailSelect = {
  id: true,
  code: true,
  name: true,
  nameEn: true,
  description: true,
  serialNumber: true,
  manufacturer: true,
  model: true,
  supplierId: true,
  supplier: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  notes: true,
  qrCode: true,
  purchaseDate: true,
  operationDate: true,
  warrantyEnd: true,
  lastMaintenanceDate: true,
  typeId: true,
  type: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  statusId: true,
  status: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      color: true,
    },
  },
  roomId: true,
  room: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      code: true,
      floor: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          code: true,
          building: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              code: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                },
              },
            },
          },
        },
      },
    },
  },
  buildingId: true,
  branchId: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

// ============================================================
// جلب أصل واحد
// ============================================================

export async function getAsset(
  session: AuthSession,
  assetId: string
): Promise<AssetResponse> {
  try {
    ensureCanViewAsset(session);
    await ensureAssetAccess(session, assetId);

    const asset = await prisma.asset.findFirst({
      where: { id: assetId, deletedAt: null },
      select: assetDetailSelect,
    });

    if (!asset) {
      throw new AssetNotFoundError('الأصل غير موجود');
    }

    return serializeAsset(asset);
  } catch (error) {
    throw handlePrismaError(error);
  }
}