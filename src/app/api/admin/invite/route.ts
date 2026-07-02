// src/app/api/admin/invite/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(req: Request) {
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

    // ✅ التحقق من الصلاحية: فقط SUPER_ADMIN يمكنه دعوة مستخدمين جدد
    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'لا تملك الصلاحية المطلوبة' },
        { status: 403 }
      );
    }

    const { email, name, roleId, companyId } = await req.json();

    if (!email || !name || !roleId || !companyId) {
      return NextResponse.json(
        { error: 'بيانات ناقصة (البريد، الاسم، الدور، والشركة مطلوبة)' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم مسبقاً
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // التحقق من وجود الشركة
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'الشركة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من وجود الدور
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'الدور غير موجود' },
        { status: 404 }
      );
    }

    // توليد رمز الدعوة
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        email,
        name,
        roleId,
        companyId,
        invitationToken: token,
        invitationExpires: expires,
        status: false, // الحساب غير نشط حتى يتم تفعيله عبر الدعوة
        password: null, // لا توجد كلمة مرور حتى يتم تعيينها
      },
    });

    // إرسال البريد الإلكتروني للدعوة
    await sendInvitationEmail(
      email,
      token,
      company.name
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        companyId: user.companyId,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('POST /api/admin/invite error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}