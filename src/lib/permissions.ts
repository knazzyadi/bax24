// src/lib/permissions.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const roleCache = new Map<string, string | null>();

/**
 * 🔐 جلب اسم الدور (مع Cache)
 */
export async function getUserRole(userId: string): Promise<string | null> {
  if (roleCache.has(userId)) return roleCache.get(userId)!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { name: true } } },
  });

  const roleName = user?.role?.name || null;
  roleCache.set(userId, roleName);
  return roleName;
}

/**
 * 🔐 جلب صلاحيات المستخدم بناءً على دوره (بدون جداول صلاحيات)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const roleName = await getUserRole(userId);
  if (!roleName) return [];

  // تعريف الصلاحيات لكل دور بشكل ثابت (يمكن تعديلها حسب المشروع)
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
      'maintenance.read', // يمكن للفني عرض جداول الصيانة
    ],
  };

  return rolePermissions[roleName] || [];
}

/**
 * 🔐 التحقق من وجود جلسة صالحة
 */
async function getSessionOrThrow(session?: any) {
  const currentSession = session || (await auth());
  if (!currentSession?.user?.id) {
    throw new Error('UNAUTHORIZED: لا توجد جلسة نشطة');
  }
  return currentSession;
}

/**
 * 🔐 التحقق من صلاحية واحدة (Throws) – مع دعم `*` للصلاحية الكاملة
 */
export async function requirePermission(
  permissionName: string,
  session?: any
): Promise<boolean> {
  const currentSession = await getSessionOrThrow(session);
  const userId = currentSession.user.id;
  const permissions = await getUserPermissions(userId);

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
  session?: any
): Promise<boolean> {
  const currentSession = await getSessionOrThrow(session);
  const userId = currentSession.user.id;
  const permissions = await getUserPermissions(userId);

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
  session?: any
): Promise<boolean> {
  const currentSession = await getSessionOrThrow(session);
  const userId = currentSession.user.id;
  const permissions = await getUserPermissions(userId);

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
  session?: any
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
  session?: any
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
  session?: any
): Promise<boolean> {
  try {
    await requireAllPermissions(permissionNames, session);
    return true;
  } catch {
    return false;
  }
}

/**
 * 🧹 مسح الكاش (عند تحديث بيانات المستخدم)
 */
export function clearPermissionCache(userId?: string) {
  if (userId) {
    roleCache.delete(userId);
  } else {
    roleCache.clear();
  }
}