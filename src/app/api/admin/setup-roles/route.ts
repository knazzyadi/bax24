import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET: جلب جميع الأدوار
export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const roles = await prisma.role.findMany({
      select: { id: true, name: true, label: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطأ في جلب الأدوار' }, { status: 500 });
  }
}

// POST: إنشاء الأدوار
export async function POST() {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

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