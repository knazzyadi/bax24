// src/lib/mappers/asset.mapper.ts

import type { Asset } from '@/types/assets';
import type { AssetWithRelations } from '@/lib/repositories/asset.repository';

export function mapAsset(asset: AssetWithRelations): Asset {
  return {
    id: asset.id,
    code: asset.code,
    name: asset.name,
    companyId: asset.companyId,

    nameEn: asset.nameEn ?? undefined,
    description: asset.description ?? undefined,

    typeId: asset.typeId ?? undefined,
    statusId: asset.statusId ?? undefined,
    roomId: asset.roomId ?? undefined,
    supplierId: asset.supplierId ?? undefined,
    buildingId: asset.buildingId ?? undefined,
    branchId: asset.branchId ?? undefined,

    serialNumber: asset.serialNumber ?? undefined,
    manufacturer: asset.manufacturer ?? undefined,
    model: asset.model ?? undefined,
    notes: asset.notes ?? undefined,
    qrCode: asset.qrCode ?? undefined,

    purchaseDate: asset.purchaseDate?.toISOString() ?? null,
    operationDate: asset.operationDate?.toISOString() ?? null,
    warrantyEnd: asset.warrantyEnd?.toISOString() ?? null,
    lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString() ?? null,

    deletedAt: asset.deletedAt?.toISOString() ?? null,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),

    type: undefined,
    status: undefined,
    room: undefined,
    supplier: undefined,
  };
}