// src/app/api/admin/profile/route.ts
import { NextResponse } from 'next/server';


import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
// ✅ دالة مساعدة لجلب الجلسة ديناميكياً
async function getAuthSession() {
  const { auth } = await import('@/auth');
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function PUT(request: Request) {
  try {
    // ✅ استيراد ديناميكي لـ auth
    const session = await getAuthenticatedSession();

    // ✅ التحقق من صلاحية SUPER_ADMIN
    if (session.role !== 'SUPER_ADMIN') {
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
      where: { id: session.id },
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

    const updateData: {
      name: string;
      email: string;
      password?: string;
    } = {
      name,
      email,
    };

    // تحديث كلمة المرور فقط إذا تم إدخالها
    if (password) {
      // ✅ استيراد bcrypt ديناميكياً
      const bcrypt = (await import('bcryptjs')).default;
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
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

  } catch (error: any) {
    console.error('PROFILE_UPDATE_ERROR:', error);
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'خطأ في تحديث الملف الشخصي' },
      { status: 500 }
    );
  }
}