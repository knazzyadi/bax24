import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@bax24.com',
      to: ['your-personal-email@gmail.com'], // استبدل بأي بريد حقيقي
      subject: 'اختبار Resend مع النطاق المخصص',
      html: '<h1>نجح الإرسال!</h1><p>هذا إيميل من bax24.com ✅</p>',
    });
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}