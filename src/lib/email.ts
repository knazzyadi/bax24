import { Resend } from 'resend';

export async function sendInvitationEmail(to: string, token: string, companyName: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const inviteLink = `${process.env.NEXTAUTH_URL}/ar/accept-invitation?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@bax24.com',
    to: [to],
    subject: 'انضمام إلى bax24',
    html: `<h1>مرحباً</h1><p>تمت دعوتك لشركة ${companyName}. <a href="${inviteLink}">تفعيل الحساب</a> (صالح 24 ساعة)</p>`,
  });
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resetLink = `${process.env.NEXTAUTH_URL}/ar/reset-password?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@bax24.com',
    to: [to],
    subject: 'استعادة كلمة المرور',
    html: `<a href="${resetLink}">إعادة تعيين كلمة المرور</a> (صالح 30 دقيقة)`,
  });
}