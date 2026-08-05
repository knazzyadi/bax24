// src/app/api/companies/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { CompanyService } from '@/services/CompanyService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'حدث خطأ غير معروف';
}

// GET: جلب شركة واحدة
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const permissionError = requirePermission(
      session,
      'companies.read'
    );

    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;

    const company = await CompanyService.getById(id);

    return NextResponse.json(company);
  } catch (error: unknown) {
    console.error('GET /api/companies/[id]', error);

    const message = getErrorMessage(error);

    if (message === 'الشركة غير موجودة') {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// PUT: تحديث شركة
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const permissionError = requirePermission(
      session,
      'companies.update'
    );

    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await CompanyService.update(id, body);

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('PUT /api/companies/[id]', error);

    const message = getErrorMessage(error);

    if (message === 'الشركة غير موجودة') {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    if (message === 'يوجد شركة بنفس الاسم') {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// DELETE: حذف شركة
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const permissionError = requirePermission(
      session,
      'companies.delete'
    );

    if (permissionError) {
      return permissionError;
    }

    const { id } = await params;

    await CompanyService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/companies/[id]', error);

    const message = getErrorMessage(error);

    if (message === 'الشركة غير موجودة') {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    if (message === 'لا يمكن حذف الشركة لوجود بيانات مرتبطة') {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}