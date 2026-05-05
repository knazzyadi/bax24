// create-super-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'kn.azzyadi@gmail.com';
  const password = 'Kn240360240360';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. البحث عن دور "SUPER_ADMIN" أو إنشائه (تأكد من وجوده في نموذج Role)
  let role = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN' }
  });

  if (!role) {
    // إذا كان النموذج له حقول مثل name, nameEn, إلخ، ننشئه
    role = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        nameEn: 'Super Admin',
        // أضف أي حقول مطلوبة أخرى (مثل companyId إذا كان مطلوباً وربطه بشركة المستخدم)
        // هنا قد تحتاج إلى تحديد companyId إذا كان الحقل مطلوباً في نموذج Role.
        // إذا كان هناك علاقة مع Company، فسيكون الأمر أكثر تعقيداً. سنفترض أبسط حالة:
      }
    });
    console.log('✅ Role SUPER_ADMIN created');
  } else {
    console.log('✅ Role SUPER_ADMIN found');
  }

  // 2. إنشاء المستخدم وربطه بالدور عبر connect
  const user = await prisma.user.upsert({
    where: { email: email },
    update: {},
    create: {
      email: email,
      name: 'Super Admin',
      password: hashedPassword,
      role: {
        connect: { id: role.id }
      }
    },
  });
  console.log('✅ Super admin created:', user.email);
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());