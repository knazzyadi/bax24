// src/app/api/company/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/lib/server/services/user.service';

// ============================================================
// PUT - تحديث مستخدم
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    // ✅ 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'users.update');
    if (permissionError) return permissionError;

    // ✅ 3. استخراج companyId
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'معرف الشركة غير متوفر' },
        { status: 400 }
      );
    }

    // ✅ 4. استخراج id من params
    const { id } = await params;

    // ✅ 5. قراءة الجسم
    const body = await request.json();

    // ✅ 6. دعم استعادة المستخدم
    if (body.action === 'restore') {
      const user = await UserService.restoreUser(id, companyId);
      return NextResponse.json(user);
    }

    // ✅ 7. تحديث المستخدم
    const user = await UserService.updateUser(id, companyId, body);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('PUT /api/company/users/[id]', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 400 });
  }
}

// ============================================================
// DELETE - حذف مستخدم
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ 1. جلب الجلسة
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    // ✅ 2. التحقق من الصلاحية
    const permissionError = requirePermission(session, 'users.delete');
    if (permissionError) return permissionError;

    // ✅ 3. استخراج companyId
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'معرف الشركة غير متوفر' },
        { status: 400 }
      );
    }

    // ✅ 4. استخراج id من params
    const { id } = await params;

    // ✅ 5. حذف المستخدم
    await UserService.deleteUser(id, companyId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/company/users/[id]', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}