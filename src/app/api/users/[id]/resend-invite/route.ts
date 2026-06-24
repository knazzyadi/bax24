import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession, requirePermission } from '@/lib/auth-helper';

import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true, company: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // منع إعادة الدعوة للسوبر أدمن
    if (user.role?.name === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'لا يمكن إعادة إرسال دعوة للسوبر أدمن' },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        invitationToken: token,
        invitationExpires: expires,
        status: false,
        password: null,
      },
    });

    await sendInvitationEmail(
      user.email,
      token,
      user.company?.name || 'الشركة'
    );

    return NextResponse.json({
      success: true,
      message: 'تم إرسال الدعوة مجدداً',
    });
  } catch (error) {
    console.error('RESEND_INVITE_ERROR:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}