import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // قائمة الأدوار المطلوبة
    const roles = [
      { name: 'SUPER_ADMIN', label: 'Super Administrator' },
      { name: 'ADMIN', label: 'Company Administrator' },
      { name: 'SUPERVISOR', label: 'Supervisor' },
      { name: 'TECHNICIAN', label: 'Technician' },
    ];

    const results = [];
    for (const role of roles) {
      const result = await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
      results.push(result);
    }

    return NextResponse.json({ success: true, created: results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'فشل في تهيئة الأدوار' }, { status: 500 });
  }
}