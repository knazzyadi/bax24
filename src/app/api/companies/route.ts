// src/app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { CompanyService } from '@/services/CompanyService';

// GET: جلب جميع الشركات
export async function GET(request: NextRequest) {
  try {
    await requirePermission('companies.read');

    const companies = await CompanyService.getAll();

    return NextResponse.json(companies);
  } catch (error: any) {
    console.error('==============================');
    console.error('GET /api/companies FULL ERROR');
    console.error(error);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
    console.error('==============================');

    if (error?.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (error?.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'لا تملك الصلاحية' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'حدث خطأ في الخادم',
        stack:
          process.env.NODE_ENV === 'development'
            ? error?.stack
            : undefined,
      },
      { status: 500 }
    );
  }
}

// POST: إنشاء شركة جديدة
export async function POST(request: NextRequest) {
  try {
    await requirePermission('companies.create');

    const body = await request.json();

    const company = await CompanyService.create(body);

    const companyWithStats = await CompanyService.getById(company.id);

    return NextResponse.json(companyWithStats, { status: 201 });
  } catch (error: any) {
    console.error('==============================');
    console.error('POST /api/companies FULL ERROR');
    console.error(error);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
    console.error('==============================');

    if (error?.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (error?.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'لا تملك الصلاحية' },
        { status: 403 }
      );
    }

    if (
      error?.message === 'يوجد شركة بنفس الاسم' ||
      error?.message === 'اسم الشركة مطلوب'
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'حدث خطأ في الخادم',
        stack:
          process.env.NODE_ENV === 'development'
            ? error?.stack
            : undefined,
      },
      { status: 500 }
    );
  }
}