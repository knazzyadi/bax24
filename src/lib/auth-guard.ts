import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function requireSuperAdmin() {
  const session = await auth();

  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return {
      error: NextResponse.json({ error: 'غير مصرح' }, { status: 401 }),
    };
  }

  return { session };
}