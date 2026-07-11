// src/app/api/asset-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';

// =====================
// GET: جلب قائمة أنواع الأصول
// =====================
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.read');

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '100');

    // تحديد الشركة
    let targetCompanyId = companyId;
    if (session.role !== 'SUPER_ADMIN') {
      targetCompanyId = session.companyId;
    }
    if (!targetCompanyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const assetTypes = await prisma.assetType.findMany({
      where: {
        companyId: targetCompanyId,
        deletedAt: null, // استبعاد المحذوفين
      },
      orderBy: { order: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        order: true,
        isDefault: true,
        isActive: true,
      },
    });

    return NextResponse.json(assetTypes);
  } catch (error: any) {
    console.error('GET /api/asset-types error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// POST: إضافة نوع أصل جديد
// =====================
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.create');

    const body = await request.json();
    const { name, nameEn, code, description, order, isDefault, isActive, companyId } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    // تحديد الشركة
    let targetCompanyId = companyId;
    if (session.role !== 'SUPER_ADMIN') {
      targetCompanyId = session.companyId;
    }
    if (!targetCompanyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // التحقق من عدم تكرار الاسم أو الكود
    const existing = await prisma.assetType.findFirst({
      where: {
        companyId: targetCompanyId,
        deletedAt: null,
        OR: [
          { name: name.trim() },
          { code: code?.trim() || undefined },
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'يوجد نوع أصل بنفس الاسم أو الكود بالفعل' },
        { status: 409 }
      );
    }

    // استخدام transaction لضمان ذرية تحديث isDefault
    const newType = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.assetType.updateMany({
          where: { companyId: targetCompanyId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.assetType.create({
        data: {
          name: name.trim(),
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          order: typeof order === 'number' ? order : 0,
          isDefault: isDefault === true,
          isActive: isActive ?? true,
          companyId: targetCompanyId,
        },
      });
    });

    return NextResponse.json(newType, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/asset-types error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// PUT: تحديث نوع أصل
// =====================
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.update');

    const body = await request.json();
    const { id, name, nameEn, code, description, order, isDefault, isActive, companyId } = body;

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    // تحديد الشركة
    let targetCompanyId = companyId;
    if (session.role !== 'SUPER_ADMIN') {
      targetCompanyId = session.companyId;
    }
    if (!targetCompanyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // التحقق من وجود النوع
    const existingType = await prisma.assetType.findFirst({
      where: { id, companyId: targetCompanyId, deletedAt: null },
    });
    if (!existingType) {
      return NextResponse.json({ error: 'نوع الأصل غير موجود' }, { status: 404 });
    }

    // التحقق من عدم تكرار الاسم أو الكود (باستثناء نفس النوع)
    if (name || code) {
      const duplicate = await prisma.assetType.findFirst({
        where: {
          companyId: targetCompanyId,
          deletedAt: null,
          NOT: { id },
          OR: [
            { name: name?.trim() || undefined },
            { code: code?.trim() || undefined },
          ],
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'يوجد نوع أصل بنفس الاسم أو الكود بالفعل' },
          { status: 409 }
        );
      }
    }

    // تحديث داخل transaction
    const updatedType = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.assetType.updateMany({
          where: { companyId: targetCompanyId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.assetType.update({
        where: { id },
        data: {
          name: name?.trim() ?? existingType.name,
          nameEn: nameEn?.trim() ?? null,
          code: code?.trim() ?? null,
          description: description?.trim() ?? null,
          order: typeof order === 'number' ? order : existingType.order,
          isDefault: isDefault === true,
          isActive: isActive ?? existingType.isActive,
        },
      });
    });

    return NextResponse.json(updatedType);
  } catch (error: any) {
    console.error('PUT /api/asset-types error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// DELETE: حذف نوع أصل (Soft Delete)
// =====================
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.delete');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    // تحديد الشركة
    const targetCompanyId = session.role !== 'SUPER_ADMIN' 
      ? session.companyId 
      : searchParams.get('companyId') || session.companyId;
    
    if (!targetCompanyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // التحقق من وجود النوع
    const assetType = await prisma.assetType.findFirst({
      where: { id, companyId: targetCompanyId, deletedAt: null },
    });
    if (!assetType) {
      return NextResponse.json({ error: 'نوع الأصل غير موجود' }, { status: 404 });
    }

    // منع حذف النوع الافتراضي
    if (assetType.isDefault) {
      return NextResponse.json(
        { error: 'لا يمكن حذف النوع الافتراضي' },
        { status: 400 }
      );
    }

    // Soft Delete
    await prisma.assetType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/asset-types error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}