// src/app/api/work-order-statuses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب قائمة حالات أوامر العمل
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

    const statuses = await prisma.workOrderStatus.findMany({
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
        color: true,
        order: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error in GET /api/work-order-statuses:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب حالات أوامر العمل' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - إنشاء حالة جديدة
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
    const { name, nameEn, code, color, order, isDefault, isActive } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    const existing = await prisma.workOrderStatus.findFirst({
      where: {
        companyId,
        name: name.trim(),
        deletedAt: null,
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'هناك حالة بنفس الاسم بالفعل' }, { status: 409 });
    }

    if (isDefault) {
      await prisma.workOrderStatus.updateMany({
        where: { companyId, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const newStatus = await prisma.workOrderStatus.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        color: color || '#6B7280',
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
        color: true,
        order: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/work-order-statuses:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحالة' },
      { status: 500 }
    );
  }
}