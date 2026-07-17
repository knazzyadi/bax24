// src/lib/assets/audit.ts

import { prisma } from '@/lib/prisma';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE' | 'RESTORE';

export interface AuditLogChanges {
  [key: string]: { old: unknown; new: unknown };
}

// ============================================================
// بناء الفروقات
// ============================================================

export function buildDiff<T extends Record<string, unknown>>(
  oldData: T,
  newData: T,
  fieldsToCompare: (keyof T)[]
): AuditLogChanges {
  const changes: AuditLogChanges = {};
  for (const field of fieldsToCompare) {
    const oldVal = oldData[field];
    const newVal = newData[field];
    if (!deepEqual(oldVal, newVal)) {
      changes[field as string] = { old: oldVal, new: newVal };
    }
  }
  return changes;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return a === b;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Date || b instanceof Date) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (Array.isArray(a) || Array.isArray(b)) return false;
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!(key in (b as object))) return false;
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
    }
    return true;
  }
  return a === b;
}

// ============================================================
// إنشاء سجل تدقيق
// ============================================================

export async function createAuditLog(
  userId: string,
  assetId: string,
  action: AuditAction,
  changes: AuditLogChanges | null,
  metadata?: Record<string, unknown>
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    await prisma.auditLog.create({
      data: {
        assetId,
        userId,
        userEmail: user?.email || 'unknown',
        action,
        changes: changes ?? undefined,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // لا نرمي الخطأ حتى لا يعطل العملية الأساسية
  }
}