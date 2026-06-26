// src/lib/auth-helper.ts
export async function getSession() {
  const { auth } = await import('@/auth');
  const session = await auth();
  return session;
}

export async function getAuthenticatedSession() {
  const session = await getSession();
  if (!session?.user) throw new Error('UNAUTHORIZED');
  return session;
}

export async function checkPermission(permissionName: string) {
  const session = await getAuthenticatedSession();
  const { requirePermission } = await import('@/lib/permissions');
  await requirePermission(permissionName, session);
  return session;
}