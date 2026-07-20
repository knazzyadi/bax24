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
  } catch (error: any) {
    console.error('GET /api/users', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
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
    if (permissionError) return permissionError;

    // ✅ 3. قراءة الجسم
    const body = await request.json();

    // ✅ 4. تنفيذ المنطق
    const user = await UserService.create(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/users', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    if (error.message === 'الاسم مطلوب' || error.message === 'البريد الإلكتروني مطلوب' ||
        error.message === 'الدور مطلوب' || error.message === 'الشركة مطلوبة') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message === 'البريد الإلكتروني مستخدم بالفعل') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}