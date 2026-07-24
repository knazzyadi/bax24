// src/app/api/work-order-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب قائمة أنواع أوامر العمل
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
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const body = await request.json();
    console.log("📦 Received body:", body); // ✅ سجل ما يصل من العميل

    const { name, nameEn, code, description, order, isDefault, isActive } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    // ✅ تحقق من الاسم المكرر
    const existing = await prisma.workOrderType.findFirst({
      where: {
        companyId,
        name: name.trim(),
        deletedAt: null,
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'هناك نوع بنفس الاسم بالفعل' }, { status: 409 });
    }

    // ✅ إذا كان افتراضيًا، قم بإلغاء الافتراضي عن الباقي
    if (isDefault) {
      await prisma.workOrderType.updateMany({
        where: { companyId, deletedAt: null },
        data: { isDefault: false },
      });
    }

    // ✅ إنشاء السجل مع قيم افتراضية للحقول المفقودة
    const newType = await prisma.workOrderType.create({
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

    return NextResponse.json(newType, { status: 201 });
  } catch (error) {
    console.error("❌ POST /api/work-order-types ERROR:", error); // ✅ سجل الخطأ كاملاً

    // ✅ أعد الخطأ الحقيقي للعميل
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
          stack: error.stack,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: JSON.stringify(error),
      },
      { status: 500 }
    );
  }
}