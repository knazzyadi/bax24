// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/services/UserService';

// GET: جلب جميع المستخدمين (للسوبر أدمن فقط)
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('users.read');

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || undefined;
    const companyId = searchParams.get('companyId') || undefined;
    const search = searchParams.get('search') || undefined;

    const users = await UserService.getAll({ role, companyId, search });
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

// POST: إنشاء مستخدم جديد (للسوبر أدمن فقط)
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('users.create');
    const body = await request.json();
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