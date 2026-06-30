// src/lib/auth/auth-helper.ts
import { auth } from '@/auth';
import { cache } from 'react';

export interface AuthSession {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  companyId: string;
  companyName: string | null;
  branchIds: string[];
  isAdmin: boolean;
}

export const getAuthSession = cache(async (): Promise<AuthSession> => {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('غير مصرح به - يرجى تسجيل الدخول');
  }

  const user = session.user;
  
  if (!user.companyId) {
    throw new Error('المستخدم غير مرتبط بشركة');
  }

  return {
    userId: user.id!,
    email: user.email!,
    name: user.name || null,
    role: user.role || 'USER',
    companyId: user.companyId,
    companyName: user.companyName || null,
    branchIds: user.branchIds || [],
    isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN',
  };
});

/**
 * فلتر الفروع بناءً على صلاحيات المستخدم
 */
export const getBranchFilter = cache((session: AuthSession) => {
  if (session.isAdmin || session.branchIds.length === 0) {
    return {};
  }
  
  return {
    branchId: { in: session.branchIds },
  };
});

/**
 * التحقق من وجود صلاحية معينة للمستخدم وإعادة الجلسة
 */
export const requirePermission = cache(async (permission: string): Promise<AuthSession> => {
  const session = await getAuthSession();
  
  if (!session.isAdmin) {
    throw new Error(`Unauthorized: missing permission '${permission}'`);
  }
  
  return session;
});

// ============================================================
// ✅ Aliases للتوافق مع الكود القديم
// ============================================================

/**
 * @deprecated استخدم getAuthSession بدلاً من ذلك
 */
export const getAuthenticatedSession = getAuthSession;

/**
 * @deprecated استخدم requirePermission بدلاً من ذلك
 */
export const checkPermission = requirePermission;