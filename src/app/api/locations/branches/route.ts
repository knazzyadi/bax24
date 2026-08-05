// src/app/api/branches/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/auth-helper';
import { BranchService } from '@/services/BranchService';

// واجهة بيانات إنشاء فرع
interface CreateBranchBody {
  name: string;
  nameEn?: string;
  code: string;
  companyId?: string;
  address?: string;
  phone?: string;
}

// ============================================================
// GET - جلب قائمة الفروع
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('branches.read');
    const { searchParams } = new URL(request.url);

    // ✅ فقط السوبر أدمن يمكنه تمرير companyId كـ Query Parameter
    const companyIdParam =
      session.role === 'SUPER_ADMIN'
        ? searchParams.get('companyId') ?? undefined
        : undefined;

    const branches = await BranchService.getAll(session, companyIdParam);
    return NextResponse.json(branches);
  } catch (error: unknown) {
    console.error('GET /api/branches', error);
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

// ============================================================
// POST - إنشاء فرع جديد
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('branches.create');
    const body = (await request.json()) as CreateBranchBody;
    const branch = await BranchService.create(body, session);
    return NextResponse.json(branch, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/branches', error);
    const message = error instanceof Error ? error.message : '';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    if (
      message === 'يوجد فرع بنفس الكود' ||
      message === 'اسم الفرع مطلوب' ||
      message === 'كود الفرع مطلوب'
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}