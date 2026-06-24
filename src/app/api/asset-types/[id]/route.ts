// src/app/api/asset-types/[id]/route.ts
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ✅ استيراد requirePermission ديناميكياً (لأنه يستخدم auth)
async function getAuthAndPermissions() {
  const { auth } = await import('@/auth');
  const { requirePermission } = await import('@/lib/permissions');
  const session = await getSession();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return { session, requirePermission };
}

// PUT: تحديث نوع أصل
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, requirePermission } = await getAuthAndPermissions();
    await requirePermission('assets.write');

    const { id } = await params;
    const { name, nameEn, code, description, order, isDefault, companyId } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    // جلب نوع الأصل الحالي
    const existingType = await prisma.assetType.findFirst({
      where: {
        id,
        companyId: session.user.companyId!,
      },
    });
    if (!existingType) {
      return NextResponse.json({ error: 'نوع الأصل غير موجود' }, { status: 404 });
    }

    // التحقق من عدم تكرار الاسم (باستثناء نفس النوع)
    const duplicate = await prisma.assetType.findFirst({
      where: {
        name: name.trim(),
        companyId: session.user.companyId!,
        NOT: { id },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: `نوع أصل بنفس الاسم "${name}" موجود بالفعل لهذه الشركة` },
        { status: 409 }
      );
    }

    // إذا كان isDefault true، قم بإلغاء الافتراضي عن الأنواع الأخرى
    if (isDefault === true && !existingType.isDefault) {
      await prisma.assetType.updateMany({
        where: { companyId: session.user.companyId!, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedType = await prisma.assetType.update({
      where: { id },
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        description: description?.trim() || null,
        order: typeof order === 'number' ? order : 0,
        isDefault: isDefault === true,
      },
    });

    revalidatePath('/ar/settings/asset-types');
    return NextResponse.json(updatedType);
  } catch (error: any) {
    console.error('PUT /api/asset-types/[id] error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'نوع أصل بنفس الاسم موجود بالفعل لهذه الشركة' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف نوع أصل
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, requirePermission } = await getAuthAndPermissions();
    await requirePermission('assets.write');

    const { id } = await params;

    // التحقق من وجود النوع
    const assetType = await prisma.assetType.findFirst({
      where: {
        id,
        companyId: session.user.companyId!,
      },
    });
    if (!assetType) {
      return NextResponse.json({ error: 'نوع الأصل غير موجود' }, { status: 404 });
    }

    await prisma.assetType.delete({ where: { id } });
    revalidatePath('/ar/settings/asset-types');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/asset-types/[id] error:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}