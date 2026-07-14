// src/app/api/company/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/lib/server/services/user.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('users.update');
    const companyId = session.companyId;
    const { id } = await params;

    const body = await request.json();

    // دعم استعادة المستخدم
    if (body.action === 'restore') {
      const user = await UserService.restoreUser(id, companyId);
      return NextResponse.json(user);
    }

    const user = await UserService.updateUser(id, companyId, body);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('PUT /api/company/users/[id]', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('users.delete');
    const companyId = session.companyId;
    const { id } = await params;

    await UserService.deleteUser(id, companyId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/company/users/[id]', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}