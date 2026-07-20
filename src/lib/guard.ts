// src/lib/guard.ts

import { getAuthenticatedSession } from "@/lib/auth";
import { RequestContext } from "./request-context";

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'TECH';

type GuardOptions = {
  roles?: Role[];
};

export async function guard(options: GuardOptions = {}) {
  // ✅ استخدام getAuthenticatedSession بدلاً من auth()
  const session = await getAuthenticatedSession();

  if (!session?.userId) {
    throw new Error('UNAUTHORIZED');
  }

  const role = session.role as Role;

  // 🧠 تخزين السياق تلقائيًا
  RequestContext.run(
    {
      user: {
        id: session.userId,
        role,
        companyId: session.companyId,
        branchId: session.branchId,
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