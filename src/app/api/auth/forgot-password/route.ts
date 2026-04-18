import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // لا نكشف عن وجود البريد لأسباب أمنية
    return NextResponse.json({ success: true });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 دقيقة

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetExpires: expires },
  });

  await sendResetPasswordEmail(email, token);
  return NextResponse.json({ success: true });
}