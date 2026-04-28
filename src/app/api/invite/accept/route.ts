import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'الرمز وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

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
        status: false, // نتأكد أن الحساب لا يزال غير نشط
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'رابط الدعوة غير صالح أو منتهي الصلاحية' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // تحديث المستخدم – نُحدث فقط الحقول الموجودة في الـ schema حالياً
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        invitationToken: null,
        invitationExpires: null,
        status: true,
        // firstLogin غير موجود في الـ schema الحالي، لذلك أزلناه
        // إذا أردت إضافة firstLogin لاحقاً، أضفه في prisma/schema.prisma ثم استخدمه هنا
      },
    });

    return NextResponse.json({ success: true, message: 'تم تفعيل الحساب بنجاح' });
  } catch (error) {
    console.error('API /invite/accept error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}