import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Kn@240360240360', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'kn.azzyadi@gmail.com' },
    update: {},
    create: {
      email: 'kn.azzyadi@gmail.com',
      password: hashedPassword,
      name: 'Super Admin',
      status: true,
      role: {
        connectOrCreate: {
          where: { name: 'SUPER_ADMIN' },
          create: { name: 'SUPER_ADMIN', label: 'Super Administrator' }
        }
      }
    },
  });
  
  console.log('Super admin created:', superAdmin.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());