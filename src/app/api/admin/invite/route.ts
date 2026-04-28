import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 🔐 صلاحية مركزية بدل role check
    await requirePermission('users.invite', session.user.id);

    const { email, name, roleId, companyId } = await req.json();

    if (!email || !name || !roleId || !companyId) {
      return NextResponse.json(
        { error: 'بيانات ناقصة' },
        { status: 400 }
      );
    }

    // 🚨 منع التلاعب: لازم الشركة تكون من الجلسة
    if (session.user.companyId !== companyId && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لهذه الشركة' },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        roleId,
        companyId,
        invitationToken: token,
        invitationExpires: expires,
        status: false,
      },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    await sendInvitationEmail(
      email,
      token,
      company?.name || 'الشركة'
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}