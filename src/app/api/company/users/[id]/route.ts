// src/app/api/company/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { id } = await params;  // ✅ استخدام await
    if (!id) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const body = await request.json();
    const { action, name, email, roleName, branchIds } = body;

    // جلب المستخدم للتأكد من أنه يتبع نفس الشركة
    const user = await prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!user || user.companyId !== companyId) {
      return NextResponse.json({ error: 'المستخدم غير موجود أو لا ينتمي لشركتك' }, { status: 404 });
    }

    // تحديث البيانات العامة
    if (action === 'update') {
      if (!name || !email || !roleName) {
        return NextResponse.json({ error: 'الاسم والبريد والدور مطلوبة' }, { status: 400 });
      }

      // التحقق من عدم تكرار البريد
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
      }

      let role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        role = await prisma.role.create({
          data: { name: roleName, label: roleName },
        });
      }

      await prisma.user.update({
        where: { id },
        data: { name, email, roleId: role.id },
      });

      // تحديث الفروع المرتبطة (عبر UserBranch)
      if (branchIds && Array.isArray(branchIds)) {
        await prisma.userBranch.deleteMany({ where: { userId: id } });
        if (branchIds.length > 0) {
          const validBranches = await prisma.branch.findMany({
            where: { id: { in: branchIds }, companyId },
            select: { id: true },
          });
          if (validBranches.length > 0) {
            await prisma.userBranch.createMany({
              data: validBranches.map(b => ({ userId: id, branchId: b.id })),
              skipDuplicates: true,
            });
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    // تبديل حالة التفعيل
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
      },
    });
    // استخدم البريد الإلكتروني الموجود في `user` (تم جلبه سابقاً)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    await sendInvitationEmail(user.email, token, company?.name || 'شركتك');
    return NextResponse.json({ success: true });
  }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('PUT /api/company/users/[id] error:', error);
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

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { companyId: true },
    });
    if (!user || user.companyId !== companyId) {
      return NextResponse.json({ error: 'المستخدم غير موجود أو لا ينتمي لشركتك' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/company/users/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}