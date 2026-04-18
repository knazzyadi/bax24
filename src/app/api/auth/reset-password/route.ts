import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { token, password } = await req.json();
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'رابط غير صالح أو منتهي' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null,
      firstLogin: false,
    },
  });

  return NextResponse.json({ success: true });
}