// scripts/create-super-admin.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'kn.azzyadi@gmail.com';
  const password = 'Kn240360240360';

  const hashedPassword = await bcrypt.hash(password, 10);

  let role = await prisma.role.findFirst({
    where: {
      name: 'SUPER_ADMIN',
    },
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        // nameEn: 'Super Admin',  // ❌ تم حذفه لأنه غير موجود في schema
      },
    });

    console.log('✅ Role SUPER_ADMIN created');
  } else {
    console.log('✅ Role SUPER_ADMIN found');
  }

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {},
    create: {
      email,
      name: 'Super Admin',
      password: hashedPassword,
      role: {
        connect: {
          id: role.id,
        },
      },
    },
  });

  console.log(`✅ Super admin created: ${user.email}`);
}

main()
  .catch((error: unknown) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });