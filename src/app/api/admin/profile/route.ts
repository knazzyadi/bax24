// src/app/api/admin/profile/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// واجهة بيانات الطلب
interface UpdateProfileBody {
  name: string;
  email: string;
  password?: string;
}

export async function PUT(request: Request) {
  try {
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // التحقق من صلاحية SUPER_ADMIN
    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 } // 403 أفضل من 401 لأن المصادقة ناجحة لكن الصلاحية غير كافية
      );
    }

    // استلام البيانات مع تحديد النوع
    const body = (await request.json()) as UpdateProfileBody;
    const { name, email, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'الاسم والبريد مطلوبان' },
        { status: 400 }
      );
    }

    // جلب المستخدم الحالي باستخدام session.userId
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
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
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
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
  } catch (error: unknown) {
    // ✅ معالجة آمنة للخطأ
    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error('PROFILE_UPDATE_ERROR:', error);
    return NextResponse.json(
      { error: `خطأ في تحديث الملف الشخصي: ${message}` },
      { status: 500 }
    );
  }
}