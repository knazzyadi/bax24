// src/lib/assets/helpers.ts

import { prisma } from '@/lib/prisma';
import { AssetBusinessError } from './errors';

// ============================================================
// ثوابت
// ============================================================

const CODE_DIGITS = 4;

// ============================================================
// توليد الكود التسلسلي
// ============================================================

export async function generateAssetCode(
  typeId: string,
  roomId: string,
  companyId: string
): Promise<string> {
  const assetType = await prisma.assetType.findUnique({
    where: { id: typeId },
    select: { code: true },
  });
  if (!assetType?.code) {
    throw new AssetBusinessError('نوع الأصل غير موجود أو لا يحتوي على رمز');
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      floor: {
        include: {
          building: {
            select: { code: true },
          },
        },
      },
    },
  });
  if (!room?.floor?.building?.code) {
    throw new AssetBusinessError('الغرفة غير موجودة أو لا تحتوي على رمز مبنى');
  }

  const buildingCode = room.floor.building.code;
  const roomCode = room.code || '';

  const count = await prisma.asset.count({
    where: {
      companyId,
      typeId,
      roomId,
      deletedAt: null,
    },
  });

  const sequenceNumber = count + 1;
  const sequencePart = String(sequenceNumber).padStart(CODE_DIGITS, '0');

  return `${buildingCode}-${roomCode}-${sequencePart}`;
}

// ============================================================
// تحويل البيانات للعرض
// ============================================================

export interface AssetResponse {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierNameEn?: string | null;
  typeId?: string | null;
  typeName?: string | null;
  typeNameEn?: string | null;
  statusId?: string | null;
  statusName?: string | null;
  statusNameEn?: string | null;
  statusColor?: string | null;
  // الموقع
  roomId?: string | null;
  roomName?: string | null;
  roomNameEn?: string | null;
  roomCode?: string | null;
  floorId?: string | null;
  floorName?: string | null;
  floorNameEn?: string | null;
  floorCode?: string | null;
  buildingId?: string | null;
  buildingName?: string | null;
  buildingNameEn?: string | null;
  buildingCode?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  branchNameEn?: string | null;
  purchaseDate?: string | null;
  operationDate?: string | null;
  warrantyEnd?: string | null;
  lastMaintenanceDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeAsset(asset: any): AssetResponse {
  const room = asset.room;
  const floor = room?.floor;
  const building = floor?.building;
  const branch = building?.branch;

  return {
    id: asset.id,
    code: asset.code,
    name: asset.name,
    nameEn: asset.nameEn || null,
    description: asset.description || null,
    serialNumber: asset.serialNumber || null,
    manufacturer: asset.manufacturer || null,
    model: asset.model || null,
    supplierId: asset.supplierId || null,
    supplierName: asset.supplier?.name || null,
    supplierNameEn: asset.supplier?.nameEn || null,
    typeId: asset.typeId || null,
    typeName: asset.type?.name || null,
    typeNameEn: asset.type?.nameEn || null,
    statusId: asset.statusId || null,
    statusName: asset.status?.name || null,
    statusNameEn: asset.status?.nameEn || null,
    statusColor: asset.status?.color || null,

    roomId: asset.roomId || null,
    roomName: room?.name || null,
    roomNameEn: room?.nameEn || null,
    roomCode: room?.code || null,

    floorId: floor?.id || null,
    floorName: floor?.name || null,
    floorNameEn: floor?.nameEn || null,
    floorCode: floor?.code || null,

    buildingId: building?.id || null,
    buildingName: building?.name || null,
    buildingNameEn: building?.nameEn || null,
    buildingCode: building?.code || null,

    branchId: branch?.id || null,
    branchName: branch?.name || null,
    branchNameEn: branch?.nameEn || null,

    purchaseDate: asset.purchaseDate?.toISOString?.()?.split('T')[0] || null,
    operationDate: asset.operationDate?.toISOString?.()?.split('T')[0] || null,
    warrantyEnd: asset.warrantyEnd?.toISOString?.()?.split('T')[0] || null,
    lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString?.()?.split('T')[0] || null,
    notes: asset.notes || null,
    createdAt: asset.createdAt?.toISOString?.(),
    updatedAt: asset.updatedAt?.toISOString?.(),
  };
}

// ✅ دالة تحويل قائمة الأصول (مطلوبة في list.ts)
export function serializeAssetList(assets: any[]): any[] {
  return assets.map(serializeAsset);
}