// src/lib/authz.ts
import { RequestContext } from './request-context';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'TECH';

export async function requireAuth() {
  // ✅ استيراد ديناميكي (يبقى كما هو)
  const { auth } = await import('@/auth');
  const session = await auth();

  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }

  RequestContext.run(
    {
      user: {
        id: session.user.id,
        role: session.user.role,
        companyId: session.user.companyId,
        branchId: (session.user as any).branchId,
      },
    },
    () => {}
  );

  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireAuth();
  const userRole = session.user.role as Role;

  if (!roles.includes(userRole)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}

export function getCurrentUser() {
  const ctx = RequestContext.get();
  return ctx?.user;
}