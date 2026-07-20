// src/lib/auth/session-guards.ts

import { getAuthenticatedSession, type AuthSession } from "./auth-helper";
import { cache } from "react";

// ✅ استخدام الخصائص المسطحة مباشرة (بدون user)
export type CompanySession = AuthSession & {
  companyId: string;
};

export const requireCompanySession = cache(async (): Promise<CompanySession> => {
  const session = await getAuthenticatedSession();
  if (!session.companyId) {
    throw new Error("Company context required");
  }
  return session as CompanySession;
});

// ✅ استخدام الخصائص المسطحة مباشرة
export type SuperAdminSession = AuthSession & {
  role: "SUPER_ADMIN";
};

export const requireSuperAdminSession = cache(async (): Promise<SuperAdminSession> => {
  const session = await getAuthenticatedSession();
  if (session.role !== "SUPER_ADMIN") {
    throw new Error("Super admin role required");
  }
  return session as SuperAdminSession;
});