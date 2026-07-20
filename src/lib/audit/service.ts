// src/lib/audit/service.ts
import { prisma } from '@/lib/prisma';
import { AuditAction, AuditChange, AuditEntityType, AuditLogData } from './types';
import { changesToDb } from './diff';

/**
 * Create a single audit log entry
 */
export async function createAuditLog({
  entityType,
  entityId,
  action,
  userId,
  userEmail,
  field,
  oldValue,
  newValue,
  changes,
  metadata,
}: AuditLogData): Promise<void> {
  try {
    let companyId: string | undefined = undefined;
    // Try to get companyId from session if available
    try {
      const { getAuthenticatedSession } = await import('@/lib/auth/auth-helper');
      const session = await getAuthenticatedSession();
      // ✅ إذا كان companyId موجوداً (ليس null) نمرره، وإلا نتركه undefined
      if (session.companyId) {
        companyId = session.companyId;
      }
    } catch {
      // If session not available, companyId remains undefined
    }

    // Prepare data for database
    let finalField = field;
    let finalOldValue = oldValue;
    let finalNewValue = newValue;
    let finalChanges: any = undefined; // ✅ use undefined instead of null
    let finalMetadata: any = undefined;

    if (changes && changes.length > 0) {
      const result = changesToDb(changes);
      if (result) {
        finalField = result.field;
        finalOldValue = result.oldValue;
        finalNewValue = result.newValue;
        finalChanges = result.changes; // JSON object
      }
    }

    if (metadata) {
      finalMetadata = metadata;
    }

    // ✅ Build data object without null values for fields that don't accept null
    const data: any = {
      entityType,
      entityId,
      userId,
      userEmail,
      action,
    };

    if (companyId !== undefined) {
      data.companyId = companyId;
    }

    if (finalField !== undefined && finalField !== null) {
      data.field = finalField;
    }
    if (finalOldValue !== undefined && finalOldValue !== null) {
      data.oldValue = finalOldValue;
    }
    if (finalNewValue !== undefined && finalNewValue !== null) {
      data.newValue = finalNewValue;
    }
    if (finalChanges !== undefined && finalChanges !== null) {
      data.changes = finalChanges;
    }
    if (finalMetadata !== undefined && finalMetadata !== null) {
      data.metadata = finalMetadata;
    }

    await prisma.auditLog.create({ data });

    console.log(`✅ Audit log: ${action} on ${entityType} ${entityId}`);
  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
    // Don't throw - audit failure should not break main operation
  }
}

/**
 * Create multiple audit log entries for multiple changes
 */
export async function createAuditLogs(
  logs: AuditLogData[]
): Promise<void> {
  for (const log of logs) {
    await createAuditLog(log);
  }
}

/**
 * Fetch audit logs for an entity
 */
export async function getAuditLogs(
  entityType: AuditEntityType,
  entityId: string,
  companyId?: string | null
): Promise<any[]> {
  const where: any = {
    entityType,
    entityId,
  };

  if (companyId) {
    where.companyId = companyId;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Transform to unified format
  return logs.map(log => ({
    id: log.id,
    action: log.action,
    field: log.field,
    oldValue: log.oldValue,
    newValue: log.newValue,
    changes: log.changes,
    createdAt: log.createdAt,
    user: {
      id: log.userId,
      name: log.userEmail || 'Unknown',
      email: log.userEmail || '',
    },
  }));
}