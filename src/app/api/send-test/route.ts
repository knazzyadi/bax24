import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();

    // 🔐 حماية: فقط المستخدمين المسجلين
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const to = body?.to;

    if (!to) {
      return NextResponse.json(
        { error: 'البريد المستهدف مطلوب' },
        { status: 400 }
      );
    }

    const { Resend } = await import('resend');

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (!apiKey || !fromEmail) {
      return NextResponse.json(
        { error: 'إعدادات البريد غير مكتملة' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'اختبار الإرسال',
      html: '<p>تم الإرسال بنجاح من النظام</p>',
    });

    if (error) {
      console.error('RESEND_ERROR:', error);
      return NextResponse.json(
        { error: 'فشل إرسال البريد' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('SEND_TEST_ERROR:', error);

    return NextResponse.json(
      { error: error?.message || 'خطأ غير معروف' },
      { status: 500 }
    );
  }
}