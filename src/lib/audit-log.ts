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
 * مع استبعاد الحقول المؤقتة (createdAt, updatedAt, deletedAt)
 */
export function buildAuditDTO(asset: any): AuditAssetDTO {
  if (!asset) return null as any;

  // استبعاد الحقول المؤقتة من الكائن الأصلي
  const { createdAt, updatedAt, deletedAt, ...cleanAsset } = asset;

  return {
    id: cleanAsset.id,
    code: cleanAsset.code,
    name: cleanAsset.name,
    nameEn: cleanAsset.nameEn || undefined,
    description: cleanAsset.description || undefined,
    typeName: cleanAsset.type?.name,
    typeNameEn: cleanAsset.type?.nameEn,
    statusName: cleanAsset.status?.name,
    statusNameEn: cleanAsset.status?.nameEn,
    statusColor: cleanAsset.status?.color,
    roomName: cleanAsset.room?.name,
    roomNameEn: cleanAsset.room?.nameEn,
    roomCode: cleanAsset.room?.code,
    purchaseDate: cleanAsset.purchaseDate?.toISOString?.()?.split('T')[0] || cleanAsset.purchaseDate,
    operationDate: cleanAsset.operationDate?.toISOString?.()?.split('T')[0] || cleanAsset.operationDate,
    warrantyEnd: cleanAsset.warrantyEnd?.toISOString?.()?.split('T')[0] || cleanAsset.warrantyEnd,
    lastMaintenanceDate: cleanAsset.lastMaintenanceDate?.toISOString?.()?.split('T')[0] || cleanAsset.lastMaintenanceDate,
    serialNumber: cleanAsset.serialNumber || undefined,
    manufacturer: cleanAsset.manufacturer || undefined,
    model: cleanAsset.model || undefined,
    supplier: cleanAsset.supplier || undefined,
    notes: cleanAsset.notes || undefined,
  };
}

/**
 * مقارنة كائنين DTO وإرجاع التغييرات
 * مع تجاهل الحقول التي لا تهم المستخدم
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

  // الحقول المهمة للمقارنة (استبعاد الحقول المؤقتة)
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
    let oldVal = oldData[field];
    let newVal = newData[field];

    // توحيد القيم الفارغة (null و undefined يعاملان بنفس الطريقة)
    if (oldVal === null || oldVal === undefined) oldVal = undefined;
    if (newVal === null || newVal === undefined) newVal = undefined;

    // مقارنة دقيقة مع مراعاة أنواع البيانات
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
      console.log('📝 No changes detected, skipping audit log');
      return;
    }

    // تحديد نوع العملية
    const finalAction = action || determineAction(oldData, changes);

    // تسجيل التدقيق
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

    console.log(`✅ Audit log created: ${finalAction} for asset ${newData.code}`);
  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
    // لا نرمي الخطأ حتى لا يعطل العملية الأساسية
  }
}