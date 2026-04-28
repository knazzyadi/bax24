// src/app/api/company/users/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET: جلب المستخدمين (SUPERVISOR, TECHNICIAN, BRANCH_MANAGER) مع الفروع
export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بهذا الحساب' },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        companyId,
        role: {
          name: { in: ['SUPERVISOR', 'TECHNICIAN', 'BRANCH_MANAGER'] },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
            label: true,
          },
        },
        status: true,
        createdAt: true,
        userBranches: {
          select: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const usersWithBranches = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      branches: user.userBranches.map((ub: any) => ub.branch),
    }));

    return NextResponse.json(usersWithBranches);
  } catch (error) {
    console.error('GET /api/company/users error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// POST: إضافة مستخدم جديد
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بهذا الحساب' },
        { status: 400 }
      );
    }

    const { name, email, roleName, branchIds } = await request.json();

    if (!name || !email || !roleName) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني والدور مطلوبة' },
        { status: 400 }
      );
    }

    if (!['SUPERVISOR', 'TECHNICIAN', 'BRANCH_MANAGER'].includes(roleName)) {
      return NextResponse.json(
        { error: 'دور غير مسموح' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }

    let role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleName,
          label: roleName === 'SUPERVISOR' ? 'مشرف' : (roleName === 'TECHNICIAN' ? 'فني' : 'مدير فرع'),
        },
      });
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

    // ربط الفروع عبر UserBranch
    if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
      const validBranches = await prisma.branch.findMany({
        where: {
          id: { in: branchIds },
          companyId: companyId,
        },
        select: { id: true },
      });
      const validBranchIds = validBranches.map((b: { id: string }) => b.id);
      if (validBranchIds.length > 0) {
        await prisma.userBranch.createMany({
          data: validBranchIds.map((branchId: string) => ({
            userId: newUser.id,
            branchId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    await sendInvitationEmail(
      email,
      token,
      company?.name || 'شركتك'
    );

    return NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/company/users error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}