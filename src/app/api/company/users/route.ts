// src/app/api/company/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/lib/server/services/user.service';
import type { SharedUserFilters } from '@/lib/shared/types/user';

// ============================================================
// GET - جلب قائمة المستخدمين
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

    // ✅ 3. استخراج companyId
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'معرف الشركة غير متوفر' },
        { status: 400 }
      );
    }

    // ✅ 4. معالجة الفلاتر
    const { searchParams } = new URL(request.url);
    const filters: SharedUserFilters = {
      search: searchParams.get('search') || undefined,
      roleId: searchParams.get('roleId') || undefined,
      status: searchParams.has('status') ? searchParams.get('status') === 'true' : undefined,
      page: searchParams.has('page') ? parseInt(searchParams.get('page')!) || 1 : 1,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) || 10 : 10,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    };

    // ✅ 5. تنفيذ المنطق
    const result = await UserService.getUsers(companyId, filters);
    return NextResponse.json(result);
  } catch (error: unknown) {
  console.error('GET /api/company/users', error);

  const message =
    error instanceof Error
      ? error.message
      : 'حدث خطأ في الخادم';

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
// POST - إنشاء مستخدم جديد
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

    // ✅ 3. استخراج companyId
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'معرف الشركة غير متوفر' },
        { status: 400 }
      );
    }

    // ✅ 4. قراءة الجسم
    const body = await request.json();

    // ✅ 5. تنفيذ المنطق
    const user = await UserService.createUser(companyId, body);
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
  console.error('POST /api/company/users', error);

  const message =
    error instanceof Error
      ? error.message
      : 'حدث خطأ في الخادم';

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
    { error: message },
    { status: 400 }
  );
}
}