// src/app/api/companies/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET: جلب جميع الشركات مع بيانات المدير (ADMIN)
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        isActive: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
        users: {
          where: { role: { name: 'ADMIN' } },
          take: 1,
          select: { email: true, name: true },
        },
      },
    });

    const formattedCompanies = companies.map((company) => ({
      id: company.id,
      name: company.name,
      nameEn: company.nameEn,
      isActive: company.isActive,
      subscriptionStartDate: company.subscriptionStartDate,
      subscriptionEndDate: company.subscriptionEndDate,
      createdAt: company.createdAt,
      adminEmail: company.users[0]?.email || null,
      adminName: company.users[0]?.name || null,
    }));

    return NextResponse.json(formattedCompanies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إنشاء شركة جديدة مع مديرها (ADMIN) وإرسال دعوة عبر البريد
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const {
      companyNameAr,
      companyNameEn,
      adminName,
      adminEmail,
      subscriptionStartDate,
      subscriptionEndDate,
    } = await request.json();

    if (!companyNameAr || !adminName || !adminEmail) {
      return NextResponse.json({ error: 'بيانات ناقصة (اسم الشركة، اسم المدير، البريد الإلكتروني مطلوبة)' }, { status: 400 });
    }

    // التحقق من عدم وجود شركة بنفس الاسم
    const existingCompany = await prisma.company.findFirst({
      where: { name: companyNameAr },
    });
    if (existingCompany) {
      return NextResponse.json({ error: 'اسم الشركة موجود مسبقاً' }, { status: 409 });
    }

    // التحقق من عدم وجود بريد إلكتروني مكرر للمدير
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني للمدير مستخدم بالفعل' }, { status: 409 });
    }

    // الحصول على دور ADMIN (إنشاؤه إذا لم يكن موجوداً)
    let adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: 'ADMIN', label: 'Company Administrator' },
      });
      console.log('✅ تم إنشاء دور ADMIN تلقائياً');
    }

    // تحويل التواريخ بشكل آمن
    const startDate =
      subscriptionStartDate && !isNaN(new Date(subscriptionStartDate).getTime())
        ? new Date(subscriptionStartDate)
        : null;
    const endDate =
      subscriptionEndDate && !isNaN(new Date(subscriptionEndDate).getTime())
        ? new Date(subscriptionEndDate)
        : null;

    // توليد رمز الدعوة (صلاحية 24 ساعة)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

    // إنشاء الشركة والمستخدم في معاملة واحدة
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyNameAr,
          nameEn: companyNameEn || null,
          isActive: true,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
        },
      });

      const adminUser = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: null, // لا توجد كلمة مرور حتى يتم تفعيل الحساب عبر الدعوة
          role: { connect: { id: adminRole.id } },
          company: { connect: { id: company.id } },
          status: false, // الحساب غير نشط
          invitationToken: token,
          invitationExpires: expires,
        },
      });

      return { company, adminUser };
    });

    // إرسال البريد الإلكتروني للدعوة (خارج المعاملة)
    await sendInvitationEmail(adminEmail, token, companyNameAr);

    return NextResponse.json(
      { success: true, company: result.company, admin: result.adminUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/companies error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}