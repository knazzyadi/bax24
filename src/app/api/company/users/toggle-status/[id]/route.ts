import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/lib/server/services/user.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('users.update');
    const companyId = session.companyId;
    const { id } = await params;

    const user = await UserService.toggleUserStatus(id, companyId);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('POST /api/company/users/toggle-status/[id]', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}