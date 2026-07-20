// src/app/api/locations/buildings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { requirePermission } from '@/lib/auth/permissions';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET: جلب جميع مباني الشركة
// ============================================================
export async function GET(request: NextRequest) {
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
    const permissionError = requirePermission(session, 'locations.read');
    if (permissionError) return permissionError;

    // ✅ 3. استخراج companyId
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بهذا الحساب' },
        { status: 400 }
      );
    }

    const buildings = await prisma.building.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    const formatted = buildings.map((b) => ({
      id: b.id,
      name: b.name,
      nameEn: b.nameEn,
      code: b.code,
      order: b.order,
      branchId: b.branchId,
      branchName: b.branch?.name || null,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('GET /api/locations/buildings error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'لا تملك الصلاحية' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: إضافة مبنى جديد
// ============================================================
export async function POST(request: NextRequest) {
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
    const permissionError = requirePermission(session, 'locations.create');
    if (permissionError) return permissionError;

    // ✅ 3. استخراج companyId
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة بهذا الحساب' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, nameEn, code, order, branchId } = body;

    // التحقق من الحقول المطلوبة
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'الاسم مطلوب' },
        { status: 400 }
      );
    }

    if (!code || code.trim() === '') {
      return NextResponse.json(
        { error: 'الكود مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من أن الفرع (إذا وُجد) ينتمي إلى نفس الشركة
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          companyId,
        },
      });
      if (!branch) {
        return NextResponse.json(
          { error: 'الفرع غير موجود أو لا ينتمي إلى هذه الشركة' },
          { status: 400 }
        );
      }
    }

    // التحقق من عدم تكرار الكود لنفس الشركة
    const existing = await prisma.building.findFirst({
      where: {
        companyId,
        code: code.trim(),
        deletedAt: null,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `يوجد مبنى بنفس الكود "${code}"` },
        { status: 409 }
      );
    }

    // إنشاء المبنى
    const building = await prisma.building.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code.trim(),
        order: typeof order === 'number' ? order : 0,
        companyId,
        branchId: branchId || null,
      },
    });

    return NextResponse.json(building, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/locations/buildings error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'لا تملك الصلاحية' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}