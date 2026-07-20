// src/lib/permissions.ts

import { getAuthenticatedSession, type AuthSession } from "@/lib/auth";

/**
 * تعريف الصلاحيات لكل دور (ثابت)
 * يمكن تعديلها حسب احتياجات المشروع
 */
const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // كل شيء
  ADMIN: ['*'], // كل شيء
  BRANCH_MANAGER: [
    // الأصول
    'assets.read', 'assets.create', 'assets.edit', 'assets.update', 'assets.delete',
    // أوامر العمل
    'work_orders.read', 'work_orders.create', 'work_orders.edit', 'work_orders.update', 'work_orders.delete', 'work_orders.execute',
    // التذاكر
    'tickets.read', 'tickets.create', 'tickets.update', 'tickets.delete',
    // المستخدمين (قراءة فقط)
    'users.read',
    // التقارير ولوحة التحكم
    'reports.view', 'dashboard.view',
    // العقود
    'contracts.read', 'contracts.create', 'contracts.edit', 'contracts.update', 'contracts.delete',
    // جداول الصيانة الوقائية
    'maintenance.read', 'maintenance.create', 'maintenance.update', 'maintenance.delete', 'maintenance.execute',
  ],
  TECH: [
    'assets.read',
    'work_orders.read', 'work_orders.execute',
    'tickets.read',
    'maintenance.read',
  ],
};

/**
 * 🔐 الحصول على جلسة المستخدم (مع تحقق من وجودها)
 */
async function getSessionOrThrow(session?: AuthSession | null): Promise<AuthSession> {
  if (session) return session;
  return getAuthenticatedSession();
}

/**
 * 🔐 الحصول على صلاحيات المستخدم بناءً على دوره
 */
export function getUserPermissionsFromRole(role: string): string[] {
  return rolePermissions[role] || [];
}

/**
 * 🔐 الحصول على صلاحيات المستخدم (تقبل session أو userId)
 * - إذا مررت session، تستخدم الدور منه.
 * - إذا مررت userId، تجلب الدور من قاعدة البيانات (حفاظاً على التوافق).
 */
export async function getUserPermissions(
  userIdOrSession: string | AuthSession
): Promise<string[]> {
  // إذا كان المدخل كائن جلسة
  if (typeof userIdOrSession !== 'string' && userIdOrSession?.role) {
    return getUserPermissionsFromRole(userIdOrSession.role);
  }

  // إذا كان userId (نص) – نحتاج لجلب الدور من قاعدة البيانات
  const userId = typeof userIdOrSession === 'string' ? userIdOrSession : userIdOrSession?.userId;
  if (!userId) return [];

  // جلب الدور من قاعدة البيانات (لحالات نادرة)
  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { name: true } } },
  });

  const roleName = user?.role?.name || 'USER';
  return getUserPermissionsFromRole(roleName);
}

/**
 * 🔐 التحقق من صلاحية واحدة (Throws)
 */
export async function requirePermission(
  permissionName: string,
  session?: AuthSession | null
): Promise<boolean> {
  const currentSession = await getSessionOrThrow(session);
  const permissions = getUserPermissionsFromRole(currentSession.role);

  if (permissions.includes('*') || permissions.includes(permissionName)) {
    return true;
  }

  throw new Error(`FORBIDDEN: لا تملك صلاحية "${permissionName}"`);
}

/**
 * 🔐 التحقق من عدة صلاحيات (OR)
 */
export async function requireAnyPermission(
  permissionNames: string[],
  session?: AuthSession | null
): Promise<boolean> {
  const currentSession = await getSessionOrThrow(session);
  const permissions = getUserPermissionsFromRole(currentSession.role);

  if (permissions.includes('*') || permissionNames.some((p) => permissions.includes(p))) {
    return true;
  }

  throw new Error(
    `FORBIDDEN: تحتاج إلى واحدة من الصلاحيات [${permissionNames.join(', ')}]`
  );
}

/**
 * 🔐 التحقق من جميع الصلاحيات (AND)
 */
export async function requireAllPermissions(
  permissionNames: string[],
  session?: AuthSession | null
): Promise<boolean> {
  const currentSession = await getSessionOrThrow(session);
  const permissions = getUserPermissionsFromRole(currentSession.role);

  if (permissions.includes('*')) return true;
  if (permissionNames.every((p) => permissions.includes(p))) return true;

  throw new Error(
    `FORBIDDEN: تحتاج إلى جميع الصلاحيات [${permissionNames.join(', ')}]`
  );
}

/**
 * 🔐 تحقق بدون رمي خطأ
 */
export async function hasPermission(
  permissionName: string,
  session?: AuthSession | null
): Promise<boolean> {
  try {
    await requirePermission(permissionName, session);
    return true;
  } catch {
    return false;
  }
}

export async function hasAnyPermission(
  permissionNames: string[],
  session?: AuthSession | null
): Promise<boolean> {
  try {
    await requireAnyPermission(permissionNames, session);
    return true;
  } catch {
    return false;
  }
}

export async function hasAllPermissions(
  permissionNames: string[],
  session?: AuthSession | null
): Promise<boolean> {
  try {
    await requireAllPermissions(permissionNames, session);
    return true;
  } catch {
    return false;
  }
}

/**
 * 🧹 الحصول على دور المستخدم من الجلسة (بدون قاعدة بيانات)
 */
export function getUserRoleFromSession(session: AuthSession): string {
  return session.role || 'USER';
}

/**
 * 🧹 (للتوافق مع الكود القديم) جلب اسم الدور من userId
 * - يُفضل استخدام الجلسة بدلاً من ذلك.
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { name: true } } },
  });
  return user?.role?.name || null;
}