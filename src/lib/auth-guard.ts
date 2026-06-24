// src/lib/auth-guard.ts
import { NextResponse } from 'next/server';

export async function requireSuperAdmin() {
  // ✅ استيراد ديناميكي لتجنب التحميل أثناء البناء
  const { auth } = await import('@/auth');
  const session = await auth();

  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return {
      error: NextResponse.json({ error: 'غير مصرح' }, { status: 401 }),
    };
  }

  return { session };
}