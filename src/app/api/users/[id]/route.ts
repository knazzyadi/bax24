// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { UserService } from '@/services/UserService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================
// GET: جلب مستخدم واحد
// ============================================================
export async function GET(request: NextRequest, { params }: RouteContext) {
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
    const permissionError = requirePermission(session, 'users.read');
    if (permissionError) return permissionError;

    // ✅ 3. استخراج id من params
    const { id } = await params;

    // ✅ 4. تنفيذ المنطق
    const user = await UserService.getById(id);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('GET /api/users/[id]', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    if (error.message === 'المستخدم غير موجود') {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ============================================================
// PUT: تحديث مستخدم
// ============================================================
export async function PUT(request: NextRequest, { params }: RouteContext) {
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

    // ✅ 3. استخراج id من params
    const { id } = await params;

    // ✅ 4. قراءة الجسم
    const body = await request.json();

    // ✅ 5. تنفيذ المنطق
    const updated = await UserService.update(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/users/[id]', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    if (error.message === 'المستخدم غير موجود') {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    if (error.message === 'البريد الإلكتروني مستخدم بالفعل') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ============================================================
// DELETE: حذف مستخدم
// ============================================================
export async function DELETE(request: NextRequest, { params }: RouteContext) {
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

    // ✅ 3. استخراج id من params
    const { id } = await params;

    // ✅ 4. تنفيذ المنطق
    await UserService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/users/[id]', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    if (error.message === 'المستخدم غير موجود') {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    if (error.message === 'لا يمكن حذف المستخدم لوجود بيانات مرتبطة') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}