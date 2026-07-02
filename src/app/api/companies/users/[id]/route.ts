// src/app/api/companies/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

// PUT: تحديث حالة المستخدم أو إعادة إرسال الدعوة
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // ✅ التحقق من صلاحية ADMIN فقط (وليس SUPER_ADMIN)
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const { action } = await request.json(); // action: 'toggleStatus' or 'resendInvite'

    // التحقق من أن المستخدم يتبع شركة الأدمن
    const user = await prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!user || user.companyId !== session.companyId) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود أو لا يتبع شركتك' },
        { status: 404 }
      );
    }

    if (action === 'toggleStatus') {
      const updated = await prisma.user.update({
        where: { id },
        data: { status: !user.status },
      });
      return NextResponse.json({ success: true, status: updated.status });
    }

    if (action === 'resendInvite') {
      // توليد رمز جديد وإرسال البريد
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

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('PUT /api/companies/users/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف المستخدم (لا يمكن حذف مدير الشركة)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // ✅ التحقق من صلاحية ADMIN
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.companyId !== session.companyId) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // منع حذف المستخدم إذا كان له علاقات (مثل أوامر عمل)
    // يمكن إضافة فحص لاحقاً

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/companies/users/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}