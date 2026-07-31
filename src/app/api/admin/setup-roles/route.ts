// src/app/api/admin/setup-roles/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requireSuperAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/prisma';

const ROLES = [
  { name: 'SUPER_ADMIN', label: 'Super Administrator' },
  { name: 'ADMIN', label: 'Company Administrator' },
  { name: 'SUPERVISOR', label: 'Supervisor' },
  { name: 'TECHNICIAN', label: 'Technician' },
];

// GET: جلب جميع الأدوار (للسوبر أدمن فقط)
export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const permissionError = requireSuperAdmin(session);
    if (permissionError) return permissionError;

    const roles = await prisma.role.findMany({
      select: { id: true, name: true, label: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error: unknown) {
    console.error('GET /api/admin/setup-roles', error);
    return NextResponse.json({ error: 'خطأ في جلب الأدوار' }, { status: 500 });
  }
}

// POST: إنشاء/تهيئة الأدوار (للسوبر أدمن فقط)
export async function POST() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const permissionError = requireSuperAdmin(session);
    if (permissionError) return permissionError;

    const results = [];

    for (const role of ROLES) {
      const result = await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });

      results.push(result);
    }

    return NextResponse.json({ success: true, created: results });
  } catch (error: unknown) {
    console.error('POST /api/admin/setup-roles', error);
    return NextResponse.json({ error: 'فشل في تهيئة الأدوار' }, { status: 500 });
  }
}