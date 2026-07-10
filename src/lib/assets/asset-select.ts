// src/lib/assets/asset-selects.ts
import { Prisma } from '@prisma/client';

export const assetAuditSelect = {
  id: true,
  code: true,
  name: true,
  nameEn: true,
  description: true,
  serialNumber: true,
  manufacturer: true,
  model: true,
  supplier: true,
  purchaseDate: true,
  operationDate: true,
  warrantyEnd: true,
  lastMaintenanceDate: true,
  notes: true,
  type: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  status: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      color: true,
    },
  },
  room: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      code: true,
    },
  },
} satisfies Prisma.AssetSelect;

export type CreatedAsset = Prisma.AssetGetPayload<{
  select: typeof assetAuditSelect;
}>;