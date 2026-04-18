import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { email, name, roleId, companyId } = await req.json();
  if (!email || !name || !roleId || !companyId) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
  }

  // التأكد من أن المستخدم ليس موجوداً مسبقاً
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

  const user = await prisma.user.create({
    data: {
      email,
      name,
      roleId,
      companyId,
      invitationToken: token,
      invitationExpires: expires,
      status: false, // غير نشط حتى يفعّل
    },
  });

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  await sendInvitationEmail(email, token, company?.name || 'الشركة');

  return NextResponse.json({ success: true, user });
}