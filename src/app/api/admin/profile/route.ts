import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'الاسم والبريد مطلوبان' },
        { status: 400 }
      );
    }

    // جلب المستخدم الحالي
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من تكرار البريد (إذا تغيّر)
    if (email !== currentUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم مسبقاً' },
          { status: 409 }
        );
      }
    }

    const updateData: any = {
      name,
      email,
    };

    // تحديث كلمة المرور فقط إذا تم إدخالها
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error('PROFILE_UPDATE_ERROR:', error);

    return NextResponse.json(
      { error: 'خطأ في تحديث الملف الشخصي' },
      { status: 500 }
    );
  }
}