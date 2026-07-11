// src/app/api/admin/setup-roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { prisma } from '@/lib/prisma';

const ROLES = [
  { name: 'SUPER_ADMIN', label: 'Super Administrator' },
  { name: 'ADMIN', label: 'Company Administrator' },
  { name: 'SUPERVISOR', label: 'Supervisor' },
  { name: 'TECHNICIAN', label: 'Technician' },
];

// GET: جلب جميع الأدوار (للسوبر أدمن فقط)
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission('admin.setup');

    const roles = await prisma.role.findMany({
      select: { id: true, name: true, label: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('GET /api/admin/setup-roles', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'خطأ في جلب الأدوار' }, { status: 500 });
  }
}

// POST: إنشاء/تهيئة الأدوار (للسوبر أدمن فقط)
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('admin.setup');

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
  } catch (error: any) {
    console.error('POST /api/admin/setup-roles', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'فشل في تهيئة الأدوار' }, { status: 500 });
  }
}