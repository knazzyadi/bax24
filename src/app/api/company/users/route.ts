import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

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
    console.error('GET /api/company/users error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إضافة مستخدم جديد (دعوة) مع إرسال بريد إلكتروني
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

    if (!['SUPERVISOR', 'TECHNICIAN'].includes(roleName)) {
      return NextResponse.json({ error: 'دور غير مسموح. اختر SUPERVISOR أو TECHNICIAN' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
    }

    // ✅ البحث عن الدور، وإنشاؤه تلقائياً إذا لم يكن موجوداً
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleName,
          label: roleName === 'SUPERVISOR' ? 'مشرف' : 'فني',
        },
      });
      console.log(`✅ تم إنشاء دور ${roleName} تلقائياً`);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    await sendInvitationEmail(email, token, company?.name || 'شركتك');

    return NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/company/users error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}