// src/app/api/admin/setup-roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
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
export async function GET(request: NextRequest) {
  try {
    // 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 2. التحقق من صلاحية SUPER_ADMIN
    const permissionError = requireSuperAdmin(session);
    if (permissionError) return permissionError;

    // 3. تنفيذ المنطق
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, label: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('GET /api/admin/setup-roles', error);
    return NextResponse.json({ error: 'خطأ في جلب الأدوار' }, { status: 500 });
  }
}

// POST: إنشاء/تهيئة الأدوار (للسوبر أدمن فقط)
export async function POST(request: NextRequest) {
  try {
    // 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 2. التحقق من صلاحية SUPER_ADMIN
    const permissionError = requireSuperAdmin(session);
    if (permissionError) return permissionError;

    // 3. تنفيذ المنطق
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
    return NextResponse.json({ error: 'فشل في تهيئة الأدوار' }, { status: 500 });
  }
}