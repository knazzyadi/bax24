// src/lib/audit/asset.ts
import { AuditEntityType, AuditAction, AuditLogData } from './types';
import { createAuditLog } from './service';
import { diffObjects } from './diff';

export interface AssetDTO {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
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

/**
 * Build AssetDTO from any asset object (Prisma or plain)
 */
export function buildAssetDTO(asset: any): AssetDTO {
  if (!asset) return null as any;

  const clean = {
    id: asset.id,
    code: asset.code,
    name: asset.name,
    nameEn: asset.nameEn || undefined,
    description: asset.description || undefined,
    typeName: asset.type?.name,
    typeNameEn: asset.type?.nameEn,
    statusName: asset.status?.name,
    statusNameEn: asset.status?.nameEn,
    statusColor: asset.status?.color,
    roomName: asset.room?.name,
    roomNameEn: asset.room?.nameEn,
    roomCode: asset.room?.code,
    purchaseDate: asset.purchaseDate?.toISOString?.()?.split('T')[0] || asset.purchaseDate,
    operationDate: asset.operationDate?.toISOString?.()?.split('T')[0] || asset.operationDate,
    warrantyEnd: asset.warrantyEnd?.toISOString?.()?.split('T')[0] || asset.warrantyEnd,
    lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString?.()?.split('T')[0] || asset.lastMaintenanceDate,
    serialNumber: asset.serialNumber || undefined,
    manufacturer: asset.manufacturer || undefined,
    model: asset.model || undefined,
    supplier: asset.supplier || undefined,
    notes: asset.notes || undefined,
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
  oldAsset?: any,
  newAsset?: any,
  metadata?: Record<string, any>
): Promise<void> {
  const oldDTO = oldAsset ? buildAssetDTO(oldAsset) : null;
  const newDTO = buildAssetDTO(newAsset || { id: assetId });

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