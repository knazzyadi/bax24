// src/app/api/work-order-priorities/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

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

    const priorities = await prisma.workOrderPriority.findMany({
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

    return NextResponse.json(priorities);
  } catch (error) {
    console.error(
      'Error in GET /api/work-order-priorities:',
      error
    );

    return NextResponse.json(
      { error: 'حدث خطأ في جلب الأولويات' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();

    const {
      name,
      nameEn,
      code,
      color,
      order,
      isDefault,
      isActive,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'الاسم مطلوب' },
        { status: 400 }
      );
    }

    const existing = await prisma.workOrderPriority.findFirst({
      where: {
        companyId,
        name: name.trim(),
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'هناك أولوية بنفس الاسم بالفعل' },
        { status: 409 }
      );
    }

    if (isDefault) {
      await prisma.workOrderPriority.updateMany({
        where: {
          companyId,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newPriority = await prisma.workOrderPriority.create({
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

    return NextResponse.json(newPriority, {
      status: 201,
    });
  } catch (error) {
    console.error(
      'Error in POST /api/work-order-priorities:',
      error
    );

    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الأولوية' },
      { status: 500 }
    );
  }
}