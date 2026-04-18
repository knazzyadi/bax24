import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

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