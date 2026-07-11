// src/app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { CompanyService } from '@/services/CompanyService';

// GET: جلب جميع الشركات (للسوبر أدمن فقط)
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('companies.read');
    // يمكن إضافة فلترة حسب الصلاحية لاحقاً
    const companies = await CompanyService.getAll();
    return NextResponse.json(companies);
  } catch (error: any) {
    console.error('GET /api/companies', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إنشاء شركة جديدة
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('companies.create');
    const body = await request.json();
    const company = await CompanyService.create(body);
    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/companies', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    if (error.message === 'يوجد شركة بنفس الاسم' || error.message === 'اسم الشركة مطلوب') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}