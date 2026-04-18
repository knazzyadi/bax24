import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail(to: string, token: string, companyName: string) {
  const inviteLink = `${process.env.NEXTAUTH_URL}/invite?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@bax24.com',
    to: [to],
    subject: 'انضمام إلى bax24',
    html: `
      <h1>مرحباً بك في bax24</h1>
      <p>تم دعوتك للانضمام إلى شركة <strong>${companyName}</strong>.</p>
      <p>يرجى النقر على الرابط أدناه لتفعيل حسابك واختيار كلمة المرور:</p>
      <a href="${inviteLink}">تفعيل الحساب</a>
      <p>هذا الرابط صالح لمدة 24 ساعة.</p>
    `,
  });
}

export async function sendResetPasswordEmail(to: string, token: string) {
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@bax24.com',
    to: [to],
    subject: 'استعادة كلمة المرور',
    html: `
      <h1>طلب استعادة كلمة المرور</h1>
      <p>يمكنك إعادة تعيين كلمة المرور عبر الرابط التالي (صالح لمدة 30 دقيقة):</p>
      <a href="${resetLink}">إعادة تعيين كلمة المرور</a>
      <p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>
    `,
  });
}