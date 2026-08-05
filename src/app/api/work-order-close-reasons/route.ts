// src/app/api/work-order-close-reasons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب قائمة أسباب الإغلاق
// ============================================================
// ✅ تم إزالة المعامل غير المستخدم _request
export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const reasons = await prisma.workOrderCloseReason.findMany({
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
    console.error('Error in GET /api/work-order-close-reasons:', error);

    return NextResponse.json(
      { error: 'حدث خطأ في جلب أسباب الإغلاق' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - إنشاء سبب إغلاق جديد
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const body: {
      name?: string;
      nameEn?: string;
      code?: string;
      description?: string;
      order?: number;
      isDefault?: boolean;
      isActive?: boolean;
    } = await request.json();

    const trimmedName = body.name?.trim();

    if (!trimmedName) {
      return NextResponse.json(
        { error: 'الاسم مطلوب' },
        { status: 400 }
      );
    }

    const existing = await prisma.workOrderCloseReason.findFirst({
      where: {
        companyId,
        name: trimmedName,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'هناك سبب بنفس الاسم بالفعل' },
        { status: 409 }
      );
    }

    if (body.isDefault) {
      await prisma.workOrderCloseReason.updateMany({
        where: {
          companyId,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newReason = await prisma.workOrderCloseReason.create({
      data: {
        companyId,
        name: trimmedName,
        nameEn: body.nameEn?.trim() || null,
        code: body.code?.trim() || null,
        description: body.description?.trim() || null,
        order: body.order ?? 0,
        isDefault: body.isDefault ?? false,
        isActive: body.isActive ?? true,
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
    console.error('Error in POST /api/work-order-close-reasons:', error);

    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء سبب الإغلاق' },
      { status: 500 }
    );
  }
}