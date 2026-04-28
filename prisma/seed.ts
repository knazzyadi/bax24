import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إضافة البيانات الأولية...');

  // 1. إنشاء الأدوار الأساسية
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
  console.log(`✅ الأدوار: ${roles.map(r => r.name).join(', ')}`);

  // 2. إنشاء شركة تجريبية
  const company = await prisma.company.upsert({
    where: { name: 'الشركة التقنية الحديثة' },
    update: {},
    create: {
      name: 'الشركة التقنية الحديثة',
      isActive: true,
    },
  });
  console.log(`✅ شركة: ${company.name}`);

  // 3. إنشاء فرع رئيسي
  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      name: 'الفرع الرئيسي',
      code: 'HQ',
      companyId: company.id,
    },
  });
  console.log(`✅ فرع: ${branch.name}`);

  // 4. إنشاء مستخدم سوبر أدمن بالبريد المطلوب وكلمة المرور المطلوبة
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
  console.log(`✅ مستخدم سوبر أدمن: ${superAdmin.email} (كلمة المرور: Kn@240360240360)`);

  // (اختياري) حذف مستخدم super@admin.com إذا كان موجوداً لتجنب التداخل
  await prisma.user.deleteMany({
    where: { email: 'super@admin.com' },
  });
  console.log('🗑️ تم حذف المستخدم القديم super@admin.com (إن وجد)');

  console.log('🎉 اكتملت الإضافة.');
}

main()
  .catch(e => {
    console.error('❌ فشل الإضافة:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });