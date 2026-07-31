// src/lib/assets/helpers.ts
import { prisma } from '@/lib/prisma';
import { AssetBusinessError } from './errors';

// ============================================================
// ثوابت
// ============================================================

const CODE_DIGITS = 4;

// ============================================================
// توليد الكود التسلسلي (النظام القديم: الفرع + النوع + رقم تسلسلي)
// ============================================================

export async function generateAssetCode(
  typeId: string,
  branchId: string,
  companyId: string
): Promise<string> {
  // 1. جلب رمز النوع
  const assetType = await prisma.assetType.findUnique({
    where: { id: typeId },
    select: { code: true },
  });
  if (!assetType?.code) {
    throw new AssetBusinessError('نوع الأصل غير موجود أو لا يحتوي على رمز');
  }

  // 2. جلب رمز الفرع
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { code: true },
  });
  if (!branch?.code) {
    throw new AssetBusinessError('الفرع غير موجود أو لا يحتوي على رمز');
  }

  // 3. البحث عن آخر أصل لنفس (الشركة + الفرع + النوع) - بدون فلتر deletedAt
  const lastAsset = await prisma.asset.findFirst({
    where: {
      companyId,
      branchId,
      typeId,
    },
    orderBy: {
      code: 'desc',
    },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastAsset?.code) {
    const parts = lastAsset.code.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  // 4. توليد الكود النهائي
  const sequencePart = String(nextNumber).padStart(CODE_DIGITS, '0');
  return `${branch.code}-${assetType.code}-${sequencePart}`;
}

// ============================================================
// أنواع تحويل البيانات للعرض
// ============================================================

export interface AssetSerializeInput {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  supplierId?: string | null;
  typeId?: string | null;
  statusId?: string | null;
  roomId?: string | null;

  purchaseDate?: Date | null;
  operationDate?: Date | null;
  warrantyEnd?: Date | null;
  lastMaintenanceDate?: Date | null;

  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;

  supplier?: {
    name?: string | null;
    nameEn?: string | null;
  } | null;

  type?: {
    name?: string | null;
    nameEn?: string | null;
  } | null;

  status?: {
    name?: string | null;
    nameEn?: string | null;
    color?: string | null;
  } | null;

  room?: {
    id?: string;
    name?: string | null;
    nameEn?: string | null;
    code?: string | null;
    floor?: {
      id?: string;
      name?: string | null;
      nameEn?: string | null;
      code?: string | null;
      building?: {
        id?: string;
        name?: string | null;
        nameEn?: string | null;
        code?: string | null;
        branch?: {
          id?: string;
          name?: string | null;
          nameEn?: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
}

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

// ============================================================
// دوال التحويل (مع أنواع محددة)
// ============================================================

export function serializeAsset(asset: AssetSerializeInput): AssetResponse {
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
    createdAt: asset.createdAt?.toISOString?.() || '',
    updatedAt: asset.updatedAt?.toISOString?.() || '',
  };
}

export function serializeAssetList(
  assets: AssetSerializeInput[]
): AssetResponse[] {
  return assets.map(serializeAsset);
}