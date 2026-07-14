// src/lib/assets/list.ts

import { prisma } from '@/lib/prisma';
import { serializeAssetList, type AssetResponse } from './helpers';
import {
  ensureHasAnyBranchAccess,
  getAllowedBranchIds,
  getAllowedCompanyId,
  ensureBranchAccess,
  type AuthSession,
} from './permissions';
import { handlePrismaError } from './errors';
import type { ListAssetsOptions, ListAssetsResult } from './types';

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'code',
  'status',
  'purchaseDate',
] as const;

type AllowedSortField = typeof ALLOWED_SORT_FIELDS[number];

const assetListSelect = {
  id: true,
  code: true,
  name: true,
  nameEn: true,
  serialNumber: true,
  statusId: true,
  status: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      color: true,
    },
  },
  typeId: true,
  type: {
    select: {
      id: true,
      name: true,
      nameEn: true,
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
  supplierId: true,
  supplier: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  purchaseDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ============================================================
// جلب قائمة الأصول مع التصفية والبحث
// ============================================================

export async function listAssets(
  session: AuthSession,
  options: ListAssetsOptions
): Promise<ListAssetsResult> {
  try {
    ensureHasAnyBranchAccess(session);

    const {
      page = 1,
      limit = 10,
      search,
      status,
      typeId,
      roomId,
      branchId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const safeSortBy: AllowedSortField = ALLOWED_SORT_FIELDS.includes(sortBy as any)
      ? (sortBy as AllowedSortField)
      : 'createdAt';

    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    const allowedBranchIds = getAllowedBranchIds(session);
    if (allowedBranchIds !== null) {
      where.branchId = { in: allowedBranchIds };
    }
    const allowedCompanyId = getAllowedCompanyId(session);
    if (allowedCompanyId !== null) {
      where.companyId = allowedCompanyId;
    }
    if (branchId) {
      ensureBranchAccess(session, branchId);
      where.branchId = branchId;
    }
    if (roomId) where.roomId = roomId;
    if (typeId) where.typeId = typeId;
    if (status) where.statusId = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        select: assetListSelect,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return {
      data: serializeAssetList(assets),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw handlePrismaError(error);
  }
}