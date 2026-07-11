// src/app/api/companies/[id]/toggle-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/permissions';
import { CompanyService } from '@/services/CompanyService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requirePermission('companies.update');
    const { id } = await params;
    const updated = await CompanyService.toggleStatus(id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/companies/[id]/toggle-status', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    if (error.message === 'الشركة غير موجودة') {
      return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}