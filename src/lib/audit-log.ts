// src/lib/audit-log.ts
import { prisma } from '@/lib/prisma';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  LOCATION_CHANGE = 'LOCATION_CHANGE',
  SERIAL_CHANGE = 'SERIAL_CHANGE',
}

/**
 * DTO (Data Transfer Object) للتدقيق
 * يحتوي فقط على الحقول المهمة للقراءة البشرية
 */
export interface AuditAssetDTO {
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

interface AuditLogOptions {
  action?: AuditAction;
  oldData?: AuditAssetDTO | null;
  newData: AuditAssetDTO;
  userId: string;
  userEmail: string;
  metadata?: Record<string, any>;
}

/**
 * بناء كائن DTO من كائن الأصل (Prisma)
 */
export function buildAuditDTO(asset: any): AuditAssetDTO {
  return {
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
}

/**
 * مقارنة كائنين DTO وإرجاع التغييرات
 */
function diffDTO(
  oldData: AuditAssetDTO | null | undefined,
  newData: AuditAssetDTO
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};

  if (!oldData) {
    // إذا لم توجد بيانات قديمة، كل الحقول تعتبر جديدة
    for (const key of Object.keys(newData)) {
      changes[key] = { old: null, new: newData[key as keyof AuditAssetDTO] };
    }
    return changes;
  }

  // الحقول المهمة للمقارنة
  const fieldsToCompare: (keyof AuditAssetDTO)[] = [
    'name',
    'nameEn',
    'description',
    'typeName',
    'typeNameEn',
    'statusName',
    'statusNameEn',
    'statusColor',
    'roomName',
    'roomNameEn',
    'roomCode',
    'purchaseDate',
    'operationDate',
    'warrantyEnd',
    'lastMaintenanceDate',
    'notes',
    'serialNumber',
    'manufacturer',
    'model',
    'supplier',
  ];

  for (const field of fieldsToCompare) {
    const oldVal = oldData[field];
    const newVal = newData[field];
    if (oldVal !== newVal) {
      changes[field as string] = { old: oldVal, new: newVal };
    }
  }

  return changes;
}

/**
 * تحديد نوع العملية بناءً على التغييرات
 */
function determineAction(
  oldData: AuditAssetDTO | null | undefined,
  changes: Record<string, any>
): AuditAction {
  if (!oldData) return AuditAction.CREATE;

  // التحقق من تغييرات محددة
  if (changes.statusName) return AuditAction.STATUS_CHANGE;
  if (changes.roomName || changes.roomCode) return AuditAction.LOCATION_CHANGE;
  if (changes.serialNumber) return AuditAction.SERIAL_CHANGE;
  if (Object.keys(changes).length > 0) return AuditAction.UPDATE;

  return AuditAction.UPDATE;
}

export async function createAuditLog({
  action,
  oldData,
  newData,
  userId,
  userEmail,
  metadata,
}: AuditLogOptions) {
  try {
    // حساب الفروقات تلقائياً
    const changes = diffDTO(oldData, newData);

    // إذا لم توجد تغييرات، لا نسجل (إلا إذا كانت عملية CREATE)
    if (Object.keys(changes).length === 0 && oldData) {
      return;
    }

    // تحديد نوع العملية
    const finalAction = action || determineAction(oldData, changes);

    await prisma.auditLog.create({
      data: {
        assetId: newData.id,
        userId,
        userEmail,
        action: finalAction,
        changes,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // لا نرمي الخطأ حتى لا يعطل العملية الأساسية
  }
}