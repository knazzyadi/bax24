import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    // ✅ أضف include للـ role
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true, company: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // لا يمكن إعادة إرسال دعوة للسوبر أدمن
    if (user.role?.name === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'لا يمكن إعادة إرسال دعوة للسوبر أدمن' }, { status: 400 });
    }

    // توليد رمز دعوة جديد (صلاحية 24 ساعة)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // تحديث بيانات المستخدم
    await prisma.user.update({
      where: { id: user.id },
      data: {
        invitationToken: token,
        invitationExpires: expires,
        status: false,
        password: null,
      },
    });

    // إرسال البريد الإلكتروني
    await sendInvitationEmail(user.email, token, user.company?.name || 'الشركة');

    return NextResponse.json({ success: true, message: 'تم إرسال الدعوة مجدداً' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}