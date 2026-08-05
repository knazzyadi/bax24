// src/app/api/work-order-statuses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب قائمة حالات أوامر العمل
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
      color?: string;
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

    const existing = await prisma.workOrderStatus.findFirst({
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
        { error: 'هناك حالة بنفس الاسم بالفعل' },
        { status: 409 }
      );
    }

    if (body.isDefault) {
      await prisma.workOrderStatus.updateMany({
        where: {
          companyId,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newStatus = await prisma.workOrderStatus.create({
      data: {
        companyId,
        name: trimmedName,
        nameEn: body.nameEn?.trim() || null,
        code: body.code?.trim() || null,
        color: body.color || '#6B7280',
        order: body.order ?? 0,
        isDefault: body.isDefault ?? false,
        isActive: body.isActive ?? true,
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