// src/lib/auth/permissions.ts
import { getAuthenticatedSession, checkPermission } from './auth-helper';

/**
 * دالة موحدة للتحقق من الصلاحية وإرجاع الجلسة
 * تستخدم في جميع Routes لتقليل التكرار
 */
export async function requirePermission(permission: string) {
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  await checkPermission(permission);
  return session;
}

/**
 * دالة للتحقق من الصلاحية بدون إرجاع الجلسة (للقراءة فقط)
 */
export async function requirePermissionRead(permission: string) {
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  await checkPermission(permission);
  return session;
}