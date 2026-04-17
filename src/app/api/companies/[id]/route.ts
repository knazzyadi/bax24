import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ============================================
// Prisma Singleton (احترافي)
// ============================================
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ============================================
// Types
// ============================================
type UpdateCompanyBody = {
  name?: string;
  nameEn?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isActive?: boolean;
  adminEmail?: string;
  adminPassword?: string;
};

// ============================================
// PUT - Update Company + Admin
// ============================================
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body: UpdateCompanyBody = await request.json();

    // ============================================
    // 1. تحديث بيانات الشركة فقط
    // ============================================
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

    const updatedCompany = await prisma.company.update({
      where: { id: params.id },
      data: updateData,
    });

    // ============================================
    // 2. تحديث مدير الشركة (ADMIN)
    // ============================================
    const adminUser = await prisma.user.findFirst({
      where: {
        companyId: params.id,
        role: { name: 'ADMIN' },
      },
    });

    if (!adminUser) {
      return NextResponse.json(updatedCompany);
    }

    const userUpdateData: Record<string, any> = {};

    // Email update with validation
    if (
      body.adminEmail &&
      body.adminEmail !== adminUser.email
    ) {
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

    // Password update
    if (body.adminPassword && body.adminPassword.trim() !== '') {
      userUpdateData.password = await bcrypt.hash(body.adminPassword, 10);
    }

    // Apply user update
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: userUpdateData,
      });
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