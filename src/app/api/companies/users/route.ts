import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

const prisma = new PrismaClient();

// GET: جلب جميع المستخدمين (SUPERVISOR و TECHNICIAN) التابعين لشركة الأدمن
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بهذا الحساب' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        companyId,
        role: {
          name: { in: ['SUPERVISOR', 'TECHNICIAN'] },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true, label: true } },
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إضافة مستخدم جديد (إرسال دعوة)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بهذا الحساب' }, { status: 400 });
    }

    const { name, email, roleName } = await request.json();
    if (!name || !email || !roleName) {
      return NextResponse.json({ error: 'الاسم والبريد الإلكتروني والدور مطلوبة' }, { status: 400 });
    }

    // التأكد من أن الدور مسموح (SUPERVISOR أو TECHNICIAN)
    if (!['SUPERVISOR', 'TECHNICIAN'].includes(roleName)) {
      return NextResponse.json({ error: 'دور غير مسموح. اختر مشرف أو فني' }, { status: 400 });
    }

    // التحقق من عدم وجود بريد إلكتروني مكرر
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
    }

    // الحصول على الدور من قاعدة البيانات
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) {
      return NextResponse.json({ error: 'الدور غير موجود في النظام' }, { status: 400 });
    }

    // توليد رمز دعوة فريد (صلاحية 24 ساعة)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

    // إنشاء المستخدم (غير نشط، بدون كلمة مرور)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        roleId: role.id,
        companyId,
        status: false,
        invitationToken: token,
        invitationExpires: expires,
      },
    });

    // جلب اسم الشركة لإرساله في البريد
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    // إرسال البريد الإلكتروني للدعوة
    await sendInvitationEmail(email, token, company?.name || 'شركتك');

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}