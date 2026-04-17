import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-guard';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// ================= GET =================
export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
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

    return NextResponse.json(
      companies.map((c) => ({
        ...c,
        adminEmail: c.users[0]?.email || null,
        adminName: c.users[0]?.name || null,
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 500 });
  }
}

// ================= POST =================
export async function POST(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const {
      companyNameAr,
      companyNameEn,
      adminName,
      adminEmail,
      adminPassword,
      subscriptionStartDate,
      subscriptionEndDate,
    } = body;

    if (!companyNameAr || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const [existingCompany, existingUser] = await Promise.all([
      prisma.company.findFirst({ where: { name: companyNameAr } }),
      prisma.user.findUnique({ where: { email: adminEmail } }),
    ]);

    if (existingCompany)
      return NextResponse.json({ error: 'اسم الشركة موجود' }, { status: 409 });

    if (existingUser)
      return NextResponse.json({ error: 'الإيميل مستخدم' }, { status: 409 });

    const role = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', label: 'Company Admin' },
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyNameAr,
          nameEn: companyNameEn || null,
          subscriptionStartDate: subscriptionStartDate ? new Date(subscriptionStartDate) : null,
          subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null,
        },
      });

      const user = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          roleId: role.id,
          companyId: company.id,
          status: true,
        },
      });

      return { company, user };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'فشل إنشاء الشركة' }, { status: 500 });
  }
}