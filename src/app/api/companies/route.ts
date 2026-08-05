// src/app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { CompanyService } from '@/services/CompanyService';

// GET: جلب جميع الشركات
export async function GET() {
    try {
    // ✅ 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // ✅ 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'companies.read');
    if (permissionError) return permissionError;

    // ✅ 3. تنفيذ المنطق
    const companies = await CompanyService.getAll();

    return NextResponse.json(companies);
  } catch (error: unknown) {
  console.error('==============================');
  console.error('GET /api/companies FULL ERROR');
  console.error(error);

  const message =
    error instanceof Error
      ? error.message
      : 'حدث خطأ في الخادم';

  const stack =
    error instanceof Error
      ? error.stack
      : undefined;

  console.error('Message:', message);
  console.error('Stack:', stack);
  console.error('==============================');

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
    {
      error: message,
      stack:
        process.env.NODE_ENV === 'development'
          ? stack
          : undefined,
    },
    { status: 500 }
  );
}
}
// POST: إنشاء شركة جديدة
export async function POST(request: NextRequest) {
  try {
    // ✅ 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // ✅ 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'companies.create');
    if (permissionError) return permissionError;

    // ✅ 3. تنفيذ المنطق
    const body = await request.json();

    const company = await CompanyService.create(body);

    const companyWithStats = await CompanyService.getById(company.id);

    return NextResponse.json(companyWithStats, { status: 201 });
  } catch (error: unknown) {
  console.error('==============================');
  console.error('POST /api/companies FULL ERROR');
  console.error(error);

  const message =
    error instanceof Error
      ? error.message
      : 'حدث خطأ في الخادم';

  const stack =
    error instanceof Error
      ? error.stack
      : undefined;

  console.error('Message:', message);
  console.error('Stack:', stack);
  console.error('==============================');

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
    message === 'يوجد شركة بنفس الاسم' ||
    message === 'اسم الشركة مطلوب'
  ) {
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: message,
      stack:
        process.env.NODE_ENV === 'development'
          ? stack
          : undefined,
    },
    { status: 500 }
  );
}
}