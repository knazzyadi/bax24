// src/app/api/users/[id]/resend-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/services/UserService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission('users.update');
    const { id } = await params;
    await UserService.resendInvite(id);
    return NextResponse.json({
      success: true,
      message: 'تم إرسال الدعوة مجدداً',
    });
  } catch (error: any) {
    console.error('RESEND_INVITE_ERROR:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    if (error.message === 'المستخدم غير موجود') {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    if (error.message === 'لا يمكن إعادة إرسال دعوة للسوبر أدمن') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}