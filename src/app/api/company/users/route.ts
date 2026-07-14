// src/app/api/company/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/lib/server/services/user.service';
import type { SharedUserFilters } from '@/lib/shared/types/user';

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('users.read');
    const companyId = session.companyId;

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

    const result = await UserService.getUsers(companyId, filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GET /api/company/users', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('users.create');
    const companyId = session.companyId;
    const body = await request.json();

    const user = await UserService.createUser(companyId, body);
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/company/users', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 400 });
  }
}