import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إضافة البيانات الأولية...');

  // =========================
  // 1. Roles
  // =========================
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', label: 'Super Administrator' },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', label: 'Company Administrator' },
    }),
    prisma.role.upsert({
      where: { name: 'BRANCH_MANAGER' },
      update: {},
      create: { name: 'BRANCH_MANAGER', label: 'Branch Manager' },
    }),
    prisma.role.upsert({
      where: { name: 'TECH' },
      update: {},
      create: { name: 'TECH', label: 'Technician' },
    }),
  ]);

  console.log(`✅ Roles: ${roles.map(r => r.name).join(', ')}`);

  // =========================
  // 2. Company
  // =========================
  const company = await prisma.company.upsert({
    where: { name: 'الشركة التقنية الحديثة' },
    update: {},
    create: {
      name: 'الشركة التقنية الحديثة',
      isActive: true,
    },
  });

  console.log(`✅ Company: ${company.name}`);

  // =========================
  // 3. Branch (IMPORTANT FIX)
  // =========================
  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {
      // ⚠️ لا نغير publicToken إطلاقاً بعد الإنشاء
      name: 'الفرع الرئيسي',
      slug: 'head-office',
      allowPublicTickets: true,
    },
    create: {
      name: 'الفرع الرئيسي',
      code: 'HQ',
      slug: 'head-office',
      publicToken: randomUUID(), // يُنشأ مرة واحدة فقط
      allowPublicTickets: true,
      companyId: company.id,
    },
  });

  console.log(`✅ Branch: ${branch.name}`);

  // =========================
  // 4. Super Admin User
  // =========================
  const superAdminRole = roles.find(r => r.name === 'SUPER_ADMIN')!;

  const hashedPassword = await bcrypt.hash('Kn@240360240360', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'kn.azzyadi@gmail.com' },
    update: {
      password: hashedPassword,
      name: 'Super Admin',
      roleId: superAdminRole.id,
      companyId: company.id,
      branchId: branch.id,
      status: true,
    },
    create: {
      email: 'kn.azzyadi@gmail.com',
      name: 'Super Admin',
      password: hashedPassword,
      roleId: superAdminRole.id,
      companyId: company.id,
      branchId: branch.id,
      status: true,
    },
  });

  console.log(`✅ Super Admin: ${superAdmin.email}`);

  // =========================
  // 5. Clean old user (optional)
  // =========================
  await prisma.user.deleteMany({
    where: { email: 'super@admin.com' },
  });

  console.log('🗑️ Removed old super user if existed');

  console.log('🎉 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });