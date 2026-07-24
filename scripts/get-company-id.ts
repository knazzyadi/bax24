// scripts/get-company-id.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// محاكاة __dirname في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تحميل متغيرات البيئة من ملف .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, nameEn: true },
    });

    if (companies.length === 0) {
      console.log('⚠️  لا توجد شركات في قاعدة البيانات.');
      console.log('💡 تأكد من أنك قمت بإنشاء شركة أولاً.');
      return;
    }

    console.log('📋 قائمة الشركات:');
    console.table(companies);
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();