import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'الرمز وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // يمكن إضافة شرط لقوة كلمة المرور (مثلاً طول 6 أحرف)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        invitationExpires: { gt: new Date() },
        status: false,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'رابط الدعوة غير صالح أو منتهي الصلاحية' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        invitationToken: null,
        invitationExpires: null,
        status: true,
        firstLogin: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}