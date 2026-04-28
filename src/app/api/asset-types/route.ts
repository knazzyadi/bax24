// src/app/api/asset-types/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

// =====================
// GET: جلب قائمة أنواع الأصول
// =====================
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('assets.read', session);

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let where: any = {};
    if (session.user.role !== 'SUPER_ADMIN') {
      where.companyId = session.user.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    const assetTypes = await prisma.assetType.findMany({
      where,
      orderBy: { order: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,        // ✅ أضفنا الكود
        description: true,
        order: true,
        isDefault: true,
      },
    });

    return NextResponse.json(assetTypes);
  } catch (error: any) {
    console.error('GET /api/asset-types error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// POST: إضافة نوع أصل جديد
// =====================
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    const isAdmin = session.user.role === 'ADMIN';
    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const { name, nameEn, code, description, order, isDefault, companyId } = body;  // ✅ أضفنا code

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    let targetCompanyId = companyId;
    if (isAdmin && !isSuperAdmin) {
      targetCompanyId = session.user.companyId;
    }
    if (!targetCompanyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بهذا المستخدم' }, { status: 400 });
    }

    // التحقق من عدم وجود اسم مكرر لنفس الشركة
    const existing = await prisma.assetType.findFirst({
      where: {
        name: name.trim(),
        companyId: targetCompanyId,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `نوع أصل بنفس الاسم "${name}" موجود بالفعل لهذه الشركة` },
        { status: 409 }
      );
    }

    // إذا كان isDefault true، قم بإلغاء الافتراضي عن الأنواع الأخرى
    if (isDefault === true) {
      await prisma.assetType.updateMany({
        where: { companyId: targetCompanyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newType = await prisma.assetType.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,      // ✅ أضفنا الكود
        description: description?.trim() || null,
        order: typeof order === 'number' ? order : 0,
        isDefault: isDefault === true,
        companyId: targetCompanyId,
      },
    });

    return NextResponse.json(newType, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/asset-types error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'نوع أصل بنفس الاسم موجود بالفعل لهذه الشركة' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}