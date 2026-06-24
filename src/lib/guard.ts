// src/lib/guard.ts
import { RequestContext } from './request-context';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'TECH';

type GuardOptions = {
  roles?: Role[];
};

export async function guard(options: GuardOptions = {}) {
  // ✅ استيراد ديناميكي
  const { auth } = await import('@/auth');
  const session = await auth();

  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }

  const role = session.user.role as Role;

  // 🧠 تخزين السياق تلقائيًا
  RequestContext.run(
    {
      user: {
        id: session.user.id,
        role,
        companyId: session.user.companyId,
        branchId: (session.user as any).branchId,
      },
    },
    () => {}
  );

  // 🔐 التحقق من الدور إذا مطلوب
  if (options.roles && !options.roles.includes(role)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}