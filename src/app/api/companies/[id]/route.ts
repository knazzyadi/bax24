// src/app/api/companies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { CompanyService } from '@/services/CompanyService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: جلب شركة واحدة
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'companies.read');
    if (permissionError) return permissionError;

    // 3. تنفيذ المنطق
    const { id } = await params;
    const company = await CompanyService.getById(id);
    return NextResponse.json(company);
  } catch (error: any) {
    console.error('GET /api/companies/[id]', error);
    if (error.message === 'الشركة غير موجودة') {
      return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// PUT: تحديث شركة
export async function PUT(request: NextRequest, { params }: RouteContext) {
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
    const body = await request.json();
    const updated = await CompanyService.update(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/companies/[id]', error);
    if (error.message === 'الشركة غير موجودة') {
      return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 });
    }
    if (error.message === 'يوجد شركة بنفس الاسم') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف شركة
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'companies.delete');
    if (permissionError) return permissionError;

    // 3. تنفيذ المنطق
    const { id } = await params;
    await CompanyService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/companies/[id]', error);
    if (error.message === 'الشركة غير موجودة') {
      return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 });
    }
    if (error.message === 'لا يمكن حذف الشركة لوجود بيانات مرتبطة') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}