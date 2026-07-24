// src/app/api/branches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { BranchService } from '@/services/BranchService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT: تحديث فرع
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'branches.update');
    if (permissionError) return permissionError;

    // 3. تنفيذ المنطق
    const { id } = await params;
    const body = await request.json();
    const updated = await BranchService.update(id, body, session);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/branches/[id]', error);
    if (error.message === 'الفرع غير موجود') {
      return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 });
    }
    if (error.message === 'يوجد فرع بنفس الكود' || error.message === 'اسم الفرع مطلوب' || error.message === 'كود الفرع مطلوب') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف فرع
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'branches.delete');
    if (permissionError) return permissionError;

    // 3. تنفيذ المنطق
    const { id } = await params;
    await BranchService.delete(id, session);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/branches/[id]', error);
    if (error.message === 'الفرع غير موجود') {
      return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 });
    }
    if (error.message === 'لا يمكن حذف الفرع لوجود بيانات مرتبطة') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}