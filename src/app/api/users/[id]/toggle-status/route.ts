// src/app/api/users/[id]/toggle-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/services/UserService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================
// PATCH - تبديل حالة المستخدم (تفعيل/تعطيل)
// ============================================================
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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
    const updated = await UserService.toggleStatus(id);
    return NextResponse.json(updated);
  } catch (error: unknown) {
  console.error('PATCH /api/users/[id]/toggle-status', error);

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

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
  }