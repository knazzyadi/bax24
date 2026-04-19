import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    // ✅ قراءة الجسم مرة واحدة فقط
    const body = await request.json();
    const { action } = body;

    // التحقق من أن المستخدم يتبع شركة الأدمن
    const user = await prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!user || user.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'المستخدم غير موجود أو لا يتبع شركتك' }, { status: 404 });
    }

    // تبديل حالة التفعيل/التعطيل
    if (action === 'toggleStatus') {
      const updated = await prisma.user.update({
        where: { id },
        data: { status: !user.status },
      });
      return NextResponse.json({ success: true, status: updated.status });
    }

    // إعادة إرسال الدعوة
    if (action === 'resendInvite') {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id },
        data: {
          invitationToken: token,
          invitationExpires: expires,
          status: false,
          password: null,
        },
      });
      await sendInvitationEmail(user.email, token, user.company?.name || 'شركتك');
      return NextResponse.json({ success: true });
    }

    // تحديث بيانات المستخدم (اسم، بريد، دور)
    if (action === 'update') {
      const { name, email, roleName } = body; // استخدم الجسم المقروء مسبقاً
      if (!name || !email || !roleName) {
        return NextResponse.json({ error: 'الاسم والبريد والدور مطلوبة' }, { status: 400 });
      }
      if (!['SUPERVISOR', 'TECHNICIAN'].includes(roleName)) {
        return NextResponse.json({ error: 'دور غير مسموح' }, { status: 400 });
      }

      // التحقق من عدم وجود بريد مكرر (باستثناء هذا المستخدم)
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم من قبل' }, { status: 409 });
      }

      // الحصول على الدور الجديد (إنشاء إذا لم يوجد)
      let role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        role = await prisma.role.create({
          data: {
            name: roleName,
            label: roleName === 'SUPERVISOR' ? 'مشرف' : 'فني',
          },
        });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { name, email, roleId: role.id },
      });
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}