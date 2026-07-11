// src/app/api/branches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { BranchService } from '@/services/BranchService';

// GET: جلب جميع الفروع
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('branches.read');
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');
    const branches = await BranchService.getAll(session, companyIdParam);
    return NextResponse.json(branches);
  } catch (error: any) {
    console.error('GET /api/branches', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إنشاء فرع جديد
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('branches.create');
    const body = await request.json();
    const branch = await BranchService.create(body, session);
    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/branches', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    if (error.message === 'يوجد فرع بنفس الكود' || error.message === 'اسم الفرع مطلوب' || error.message === 'كود الفرع مطلوب') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}