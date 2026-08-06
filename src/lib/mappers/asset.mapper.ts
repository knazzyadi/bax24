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

    type: asset.type
      ? {
          ...asset.type,
          nameEn: asset.type.nameEn ?? undefined,
          code: asset.type.code ?? undefined,
          description: asset.type.description ?? undefined,
          deletedAt: asset.type.deletedAt?.toISOString() ?? null,
          createdAt: asset.type.createdAt.toISOString(),
          updatedAt: asset.type.updatedAt.toISOString(),
        }
      : undefined,

    status: asset.status
      ? {
          ...asset.status,
          nameEn: asset.status.nameEn ?? undefined,
          code: asset.status.code ?? undefined,
          color: asset.status.color ?? undefined,
          deletedAt: asset.status.deletedAt?.toISOString() ?? null,
          createdAt: asset.status.createdAt.toISOString(),
          updatedAt: asset.status.updatedAt.toISOString(),
          description: asset.status.description ?? undefined,
        }
      : undefined,

      room: asset.room
        ? {
            ...asset.room,
            nameEn: asset.room.nameEn ?? undefined,
            deletedAt: asset.room.deletedAt?.toISOString() ?? null,
            createdAt: asset.room.createdAt.toISOString(),
            updatedAt: asset.room.updatedAt.toISOString(),

            floor: asset.room.floor
              ? {
                  ...asset.room.floor,
                  nameEn: asset.room.floor.nameEn ?? undefined,

                  building: asset.room.floor.building
                    ? {
                        id: asset.room.floor.building.id,
                        name: asset.room.floor.building.name,
                        nameEn: asset.room.floor.building.nameEn ?? undefined,
                        code: asset.room.floor.building.code,
                        companyId: asset.room.floor.building.companyId,
                        branchId: asset.room.floor.building.branchId ?? '', // ✅
                        order: asset.room.floor.building.order,
                      }
                    : undefined,
                }
              : undefined,
          }
        : undefined,

    // ✅ supplier معدل بالكامل
    supplier: asset.supplier
      ? {
          id: asset.supplier.id,
          name: asset.supplier.name,
          nameEn: asset.supplier.nameEn ?? undefined,
          code: asset.supplier.code ?? undefined,
          contactPerson: asset.supplier.contactPerson ?? undefined,
          phone: asset.supplier.phone ?? undefined,
          email: asset.supplier.email ?? undefined,
          companyId: asset.supplier.companyId,
          deletedAt: asset.supplier.deletedAt?.toISOString() ?? null,
          createdAt: asset.supplier.createdAt.toISOString(),
          updatedAt: asset.supplier.updatedAt.toISOString(),
        }
      : undefined,
  };
}