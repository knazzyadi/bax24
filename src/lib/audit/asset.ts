// src/lib/audit/asset.ts
import { AuditAction } from './types';
import { createAuditLog } from './service';
import { diffObjects } from './diff';

export interface AssetDTO {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  typeName?: string;
  typeNameEn?: string;
  statusName?: string;
  statusNameEn?: string;
  statusColor?: string;
  roomName?: string;
  roomNameEn?: string;
  roomCode?: string;
  purchaseDate?: string;
  operationDate?: string;
  warrantyEnd?: string;
  lastMaintenanceDate?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  supplier?: string;
  notes?: string;
}

// أنواع مساعدة للتعامل مع الكائنات المتداخلة
type NestedObject = {
  name?: string | null;
  nameEn?: string | null;
  color?: string | null;
  code?: string | null;
};

type AssetLike = {
  id?: string;
  code?: string;
  name?: string | null;           // ✅ تم التعديل
  nameEn?: string | null;         // ✅ تم التعديل
  description?: string | null;    // ✅ تم التعديل

  type?: NestedObject | null;
  status?: NestedObject | null;
  room?: NestedObject | null;

  purchaseDate?: Date | string | null;
  operationDate?: Date | string | null;
  warrantyEnd?: Date | string | null;
  lastMaintenanceDate?: Date | string | null;

  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  supplier?: unknown;
  notes?: string | null;
};

/**
 * Build AssetDTO from any asset object (Prisma or plain)
 */
export function buildAssetDTO(
  asset: AssetLike | null
): AssetDTO | null {
  if (!asset) {
    return null;
  }

  const clean: AssetDTO = {
    id: asset.id ?? '',
    code: asset.code ?? '',
    name: asset.name ?? '',
    nameEn: asset.nameEn ?? undefined,
    description: asset.description ?? undefined,
    typeName: asset.type?.name ?? undefined,
    typeNameEn: asset.type?.nameEn ?? undefined,
    statusName: asset.status?.name ?? undefined,
    statusNameEn: asset.status?.nameEn ?? undefined,
    statusColor: asset.status?.color ?? undefined,
    roomName: asset.room?.name ?? undefined,
    roomNameEn: asset.room?.nameEn ?? undefined,
    roomCode: asset.room?.code ?? undefined,
    purchaseDate: typeof asset.purchaseDate === 'string' ? asset.purchaseDate : (asset.purchaseDate instanceof Date ? asset.purchaseDate.toISOString().split('T')[0] : undefined),
    operationDate: typeof asset.operationDate === 'string' ? asset.operationDate : (asset.operationDate instanceof Date ? asset.operationDate.toISOString().split('T')[0] : undefined),
    warrantyEnd: typeof asset.warrantyEnd === 'string' ? asset.warrantyEnd : (asset.warrantyEnd instanceof Date ? asset.warrantyEnd.toISOString().split('T')[0] : undefined),
    lastMaintenanceDate: typeof asset.lastMaintenanceDate === 'string' ? asset.lastMaintenanceDate : (asset.lastMaintenanceDate instanceof Date ? asset.lastMaintenanceDate.toISOString().split('T')[0] : undefined),
    serialNumber: asset.serialNumber ?? undefined,
    manufacturer: asset.manufacturer ?? undefined,
    model: asset.model ?? undefined,
    supplier: asset.supplier ? String(asset.supplier) : undefined,
    notes: asset.notes ?? undefined,
  };
  return clean;
}

/**
 * Create audit log for asset
 */
export async function createAssetAudit(
  action: AuditAction,
  assetId: string,
  userId: string,
  userEmail: string,
  oldAsset?: AssetLike | null,
  newAsset?: AssetLike | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const oldDTO = oldAsset ? buildAssetDTO(oldAsset) : null;
  const newDTO = buildAssetDTO(newAsset || { id: assetId });

  if (!newDTO) {
    return;
  }

  // If no old asset, it's a CREATE
  const finalAction = oldDTO ? action : AuditAction.CREATE;

  // Compute diff
  const changes = diffObjects(oldDTO, newDTO);

  // Only log if there are changes or it's a CREATE/DELETE
  if (changes.length === 0 && finalAction !== AuditAction.CREATE && finalAction !== AuditAction.DELETE) {
    console.log('📝 No changes detected, skipping asset audit log');
    return;
  }

  await createAuditLog({
    entityType: 'ASSET',
    entityId: assetId,
    action: finalAction,
    userId,
    userEmail,
    changes,
    metadata: metadata || { old: oldDTO, new: newDTO },
  });
}