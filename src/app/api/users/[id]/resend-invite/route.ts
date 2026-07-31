// src/app/api/users/[id]/resend-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/services/UserService';

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
    const permissionError = requirePermission(session, 'users.update');
    if (permissionError) return permissionError;

    // ✅ 3. استخراج id من params
    const { id } = await params;

    // ✅ 4. تنفيذ المنطق
    await UserService.resendInvite(id);
    return NextResponse.json({
      success: true,
      message: 'تم إرسال الدعوة مجدداً',
    });
} catch (error: unknown) {
  console.error('RESEND_INVITE_ERROR:', error);

  const message =
      error instanceof Error ? error.message : 'UNKNOWN_ERROR';

    if (message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'لا تملك الصلاحية' },
        { status: 403 }
      );
    }

    if (message === 'المستخدم غير موجود') {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    if (message === 'لا يمكن إعادة إرسال دعوة للسوبر أدمن') {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}