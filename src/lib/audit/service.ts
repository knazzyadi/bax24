// src/lib/audit/service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AuditEntityType, AuditLogData } from './types';
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
    let companyId: string | undefined;

    try {
      const { getAuthenticatedSession } = await import(
        '@/lib/auth/auth-helper'
      );

      const session = await getAuthenticatedSession();

      if (session.companyId) {
        companyId = session.companyId;
      }
    } catch {
      // Ignore session errors
    }

    let finalField = field;
    let finalOldValue = oldValue;
    let finalNewValue = newValue;

    let finalChanges: Prisma.InputJsonValue | undefined;
    let finalMetadata: Prisma.JsonValue | undefined;

    if (changes && changes.length > 0) {
      const result = changesToDb(changes);

      if (result) {
        finalField = result.field;
        finalOldValue = result.oldValue;
        finalNewValue = result.newValue;
        finalChanges = result.changes as unknown as Prisma.InputJsonValue;
      }
    }

    if (metadata) {
      finalMetadata = metadata as Prisma.JsonValue;
    }

    const data: Prisma.AuditLogCreateInput = {
      entityType,
      entityId,
      userId,
      userEmail,
      action,
      companyId: companyId ?? '',
    };

    if (companyId) {
      data.companyId = companyId;
    }

    if (finalField != null) {
      data.field = finalField;
    }

    if (finalOldValue != null) {
      data.oldValue = finalOldValue;
    }

    if (finalNewValue != null) {
      data.newValue = finalNewValue;
    }

    if (finalChanges != null) {
      data.changes = finalChanges;
    }

    if (finalMetadata != null) {
      data.metadata = finalMetadata;
    }

    await prisma.auditLog.create({ data });

    console.log(`✅ Audit log: ${action} on ${entityType} ${entityId}`);
  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
  }
}

/**
 * Create multiple audit log entries
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
) {
  const where: Prisma.AuditLogWhereInput = {
    entityType,
    entityId,
  };

  if (companyId) {
    where.companyId = companyId;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs.map((log) => ({
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