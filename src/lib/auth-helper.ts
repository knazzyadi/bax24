// src/lib/auth-helper.ts
export async function getSession() {
  const { auth } = await import('@/auth');
  const session = await auth();
  return session;
}

export async function requirePermission(permissionName: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('UNAUTHORIZED');
  const { requirePermission: checkPermission } = await import('@/lib/permissions');
  await checkPermission(permissionName, session);
  return session;
}