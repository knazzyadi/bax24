// src/app/api/companies/[id]/toggle-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { CompanyService } from '@/services/CompanyService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'companies.update');
    if (permissionError) return permissionError;

    // 3. تنفيذ المنطق
    const { id } = await params;
    const updated = await CompanyService.toggleStatus(id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/companies/[id]/toggle-status', error);
    if (error.message === 'الشركة غير موجودة') {
      return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}