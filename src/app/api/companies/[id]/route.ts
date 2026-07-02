import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

type UpdateCompanyBody = {
  name?: string;
  nameEn?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isActive?: boolean;
  adminEmail?: string;
  adminPassword?: string;
};

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

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateCompanyBody = await request.json();

    // بناء كائن التحديث للشركة
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;

    if (body.subscriptionStartDate !== undefined) {
      updateData.subscriptionStartDate = body.subscriptionStartDate
        ? new Date(body.subscriptionStartDate)
        : null;
    }

    if (body.subscriptionEndDate !== undefined) {
      updateData.subscriptionEndDate = body.subscriptionEndDate
        ? new Date(body.subscriptionEndDate)
        : null;
    }

    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }

    // تحديث الشركة
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    // تحديث مدير الشركة (ADMIN) إذا توفرت بيانات
    const adminUser = await prisma.user.findFirst({
      where: {
        companyId: id,
        role: { name: 'ADMIN' },
      },
    });

    if (adminUser) {
      const userUpdateData: Record<string, any> = {};

      // تحديث البريد الإلكتروني
      if (body.adminEmail && body.adminEmail !== adminUser.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: body.adminEmail },
        });
        if (existingUser && existingUser.id !== adminUser.id) {
          return NextResponse.json(
            { error: 'البريد الإلكتروني مستخدم مسبقاً' },
            { status: 409 }
          );
        }
        userUpdateData.email = body.adminEmail;
      }

      // تحديث كلمة المرور
      if (body.adminPassword && body.adminPassword.trim() !== '') {
        userUpdateData.password = await bcrypt.hash(body.adminPassword, 10);
      }

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: userUpdateData,
        });
      }
    }

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('COMPANY_UPDATE_ERROR:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث بيانات الشركة' },
      { status: 500 }
    );
  }
}