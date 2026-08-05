// src/app/api/work-order-types/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب قائمة أنواع أوامر العمل
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

    const types = await prisma.workOrderType.findMany({
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

    return NextResponse.json(types);
  } catch (error) {
    console.error('Error in GET /api/work-order-types:', error);

    return NextResponse.json(
      { error: 'حدث خطأ في جلب أنواع أوامر العمل' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - إنشاء نوع جديد
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

    console.log('📦 Received body:', body);

    const trimmedName = body.name?.trim();

    if (!trimmedName) {
      return NextResponse.json(
        { error: 'الاسم مطلوب' },
        { status: 400 }
      );
    }

    // ✅ التحقق من الاسم المكرر
    const existing = await prisma.workOrderType.findFirst({
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
        { error: 'هناك نوع بنفس الاسم بالفعل' },
        { status: 409 }
      );
    }

    // ✅ إزالة الافتراضي من البقية
    if (body.isDefault) {
      await prisma.workOrderType.updateMany({
        where: {
          companyId,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newType = await prisma.workOrderType.create({
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

    return NextResponse.json(newType, { status: 201 });
  } catch (error) {
    console.error('❌ POST /api/work-order-types ERROR:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'حدث خطأ غير متوقع',
      },
      { status: 500 }
    );
  }
}