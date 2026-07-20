// src/lib/auth-guard.ts

import { getAuthenticatedSession, checkPermission } from "@/lib/auth";

export async function authGuard(requiredRole?: string | string[]) {
  const session = await getAuthenticatedSession();
  if (!checkPermission(session, requiredRole)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}