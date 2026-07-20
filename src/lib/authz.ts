// src/lib/authz.ts

import { RequestContext } from './request-context';
import { getAuthenticatedSession } from '@/lib/auth';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'TECH';

/**
 * التحقق من وجود جلسة مستخدم صالحة
 * - تُستخدم لحماية الـ API routes و Server Actions
 * - تعيد الجلسة وتخزن بيانات المستخدم في RequestContext
 */
export async function requireAuth() {
  // ✅ استخدام النظام الجديد
  const session = await getAuthenticatedSession();

  // تخزين بيانات المستخدم في RequestContext
  RequestContext.run(
    {
      user: {
        id: session.userId,
        role: session.role,
        companyId: session.companyId,
        branchId: session.branchId,
      },
    },
    () => {}
  );

  return session;
}

/**
 * التحقق من أن المستخدم لديه أحد الأدوار المطلوبة
 * @param roles قائمة الأدوار المسموح بها
 */
export async function requireRole(roles: Role[]) {
  const session = await requireAuth();
  const userRole = session.role as Role;

  if (!roles.includes(userRole)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}

/**
 * الحصول على بيانات المستخدم الحالي من RequestContext
 * (يُستخدم في الصفحات والمكونات التي تعمل في سياق الطلب)
 */
export function getCurrentUser() {
  const ctx = RequestContext.get();
  return ctx?.user;
}