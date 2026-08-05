// src/app/api/company/users/invite/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/lib/server/services/user.service';

// ============================================================
// POST - إعادة إرسال دعوة لمستخدم
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    // ✅ 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'users.create');
    if (permissionError) return permissionError;

    // ✅ 3. استخراج companyId
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'معرف الشركة غير متوفر' },
        { status: 400 }
      );
    }

    // ✅ 4. استخراج id من params
    const { id } = await params;

    // ✅ 5. تنفيذ المنطق
    const result = await UserService.resendInvite(id, companyId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('POST /api/company/users/invite/[id]', error);
    const message = error instanceof Error ? error.message : '';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}