// src/lib/auth-helper.ts
export async function getSession() {
  const { getServerSession } = await import('next-auth');
  const { authOptions } = await import('@/auth');
  const session = await getServerSession(authOptions);
  return session;
}

export async function requirePermission(permissionName: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('UNAUTHORIZED');
  const { requirePermission: checkPermission } = await import('@/lib/permissions');
  await checkPermission(permissionName, session);
  return session;
}