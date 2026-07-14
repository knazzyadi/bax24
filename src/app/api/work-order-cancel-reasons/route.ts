// src/app/api/work-order-cancel-reasons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب قائمة أسباب الإلغاء
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'ar';

    const reasons = await prisma.workOrderCancelReason.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        order: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(reasons);
  } catch (error) {
    console.error('Error in GET /api/work-order-cancel-reasons:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب أسباب الإلغاء' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - إنشاء سبب إلغاء جديد
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const body = await request.json();
    const { name, nameEn, code, description, order, isDefault, isActive } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    const existing = await prisma.workOrderCancelReason.findFirst({
      where: {
        companyId,
        name: name.trim(),
        deletedAt: null,
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'هناك سبب بنفس الاسم بالفعل' }, { status: 409 });
    }

    if (isDefault) {
      await prisma.workOrderCancelReason.updateMany({
        where: { companyId, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const newReason = await prisma.workOrderCancelReason.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        description: description?.trim() || null,
        order: order ?? 0,
        isDefault: isDefault ?? false,
        isActive: isActive ?? true,
        companyId,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        order: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(newReason, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-order-cancel-reasons:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء سبب الإلغاء' },
      { status: 500 }
    );
  }
}