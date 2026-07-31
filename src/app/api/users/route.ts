// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/services/UserService';

// ============================================================
// GET: جلب جميع المستخدمين (للسوبر أدمن فقط)
// ============================================================
export async function GET(request: NextRequest) {
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
    const permissionError = requirePermission(session, 'users.read');
    if (permissionError) return permissionError;

    // ✅ 3. استخراج companyId وتحويل null إلى undefined
    const companyId = session.companyId;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;

    // ✅ 4. تنفيذ المنطق مع تحويل null إلى undefined
    const users = await UserService.getAll({
      role,
      search,
      companyId: session.role === 'SUPER_ADMIN' ? undefined : (companyId ?? undefined),
    });
    return NextResponse.json(users);
  } catch (error: unknown) {
  console.error('GET /api/users', error);

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

  return NextResponse.json(
    { error: 'حدث خطأ في الخادم' },
    { status: 500 }
  );
}
}
// ============================================================
// POST: إنشاء مستخدم جديد (للسوبر أدمن فقط)
// ============================================================

export async function POST(request: NextRequest) {
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

    if (permissionError) {
      return permissionError;
    }

    // ✅ 3. قراءة الجسم
    const body = await request.json();

    // ✅ 4. تنفيذ المنطق
    const user = await UserService.create(body);

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/users', error);

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

    if (
      message === 'الاسم مطلوب' ||
      message === 'البريد الإلكتروني مطلوب' ||
      message === 'الدور مطلوب' ||
      message === 'الشركة مطلوبة'
    ) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    if (message === 'البريد الإلكتروني مستخدم بالفعل') {
      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}