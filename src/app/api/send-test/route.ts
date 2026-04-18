import { NextResponse } from 'next/server';

export async function POST() {
  // ✅ إنشاء كائن Resend داخل الدالة فقط عند الحاجة
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@bax24.com',
      to: ['test@example.com'], // استبدل بالبريد المطلوب
      subject: 'اختبار الإرسال',
      html: '<p>تم الإرسال بنجاح من bax24 على Render</p>',
    });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}