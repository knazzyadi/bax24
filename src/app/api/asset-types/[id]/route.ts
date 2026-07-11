// src/app/api/asset-types/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// =====================
// GET: جلب نوع أصل واحد
// =====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.read');

    const { id } = await params;
    const targetCompanyId = session.role !== 'SUPER_ADMIN' 
      ? session.companyId 
      : new URL(request.url).searchParams.get('companyId') || session.companyId;

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const assetType = await prisma.assetType.findFirst({
      where: { id, companyId: targetCompanyId, deletedAt: null },
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

    if (!assetType) {
      return NextResponse.json({ error: 'نوع الأصل غير موجود' }, { status: 404 });
    }

    return NextResponse.json(assetType);
  } catch (error: any) {
    console.error('GET /api/asset-types/[id] error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// PUT: تحديث نوع أصل
// =====================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.update');

    const { id } = await params;
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

    // التحقق من وجود النوع
    const existingType = await prisma.assetType.findFirst({
      where: { id, companyId: targetCompanyId, deletedAt: null },
    });
    if (!existingType) {
      return NextResponse.json({ error: 'نوع الأصل غير موجود' }, { status: 404 });
    }

    // التحقق من عدم تكرار الاسم أو الكود (باستثناء نفس النوع)
    const duplicate = await prisma.assetType.findFirst({
      where: {
        companyId: targetCompanyId,
        deletedAt: null,
        NOT: { id },
        OR: [
          { name: name.trim() },
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
          name: name.trim(),
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          order: typeof order === 'number' ? order : existingType.order,
          isDefault: isDefault === true,
          isActive: isActive ?? existingType.isActive,
        },
      });
    });

    return NextResponse.json(updatedType);
  } catch (error: any) {
    console.error('PUT /api/asset-types/[id] error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// =====================
// DELETE: حذف نوع أصل (Soft Delete)
// =====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.delete');

    const { id } = await params;
    const targetCompanyId = session.role !== 'SUPER_ADMIN' 
      ? session.companyId 
      : new URL(request.url).searchParams.get('companyId') || session.companyId;

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

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
    console.error('DELETE /api/asset-types/[id] error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}