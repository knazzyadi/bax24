// src/app/api/asset-types/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب نوع واحد
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    // getAuthenticatedSession ترمي خطأ إذا لم توجد جلسة، لذا هذا التحقق غير ضروري
    // لكن نتركه للأمان
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId!; // ✅ تأكيد non-null

    const type = await prisma.assetType.findFirst({
      where: { id, companyId, deletedAt: null },
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

    if (!type) {
      return NextResponse.json({ error: 'النوع غير موجود' }, { status: 404 });
    }

    return NextResponse.json(type);
  } catch (error) {
    console.error('Error in GET /api/asset-types/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب النوع' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - تحديث نوع
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId!; // ✅ تأكيد non-null
    const body = await request.json();
    const { name, nameEn, code, description, order, isDefault, isActive } = body;

    const existingType = await prisma.assetType.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existingType) {
      return NextResponse.json({ error: 'النوع غير موجود' }, { status: 404 });
    }

    if (name?.trim()) {
      const duplicate = await prisma.assetType.findFirst({
        where: {
          companyId,
          name: name.trim(),
          deletedAt: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'هناك نوع بنفس الاسم بالفعل' }, { status: 409 });
      }
    }

    if (isDefault) {
      await prisma.assetType.updateMany({
        where: { companyId, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.assetType.update({
      where: { id },
      data: {
        name: name?.trim() || existingType.name,
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        description: description?.trim() || null,
        order: order ?? 0,
        isDefault: isDefault ?? false,
        isActive: isActive ?? true,
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/asset-types/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث النوع' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - حذف نوع (ناعم)
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const companyId = session.companyId!; // ✅ تأكيد non-null

    const existingType = await prisma.assetType.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        assets: { take: 1, select: { id: true } },
      },
    });
    if (!existingType) {
      return NextResponse.json({ error: 'النوع غير موجود' }, { status: 404 });
    }

    // ✅ الآن خاصية assets موجودة لأننا أضفنا include
    if (existingType.assets.length > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف النوع لأنه مستخدم في أصول موجودة' },
        { status: 409 }
      );
    }

    await prisma.assetType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'تم حذف النوع بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/asset-types/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف النوع' },
      { status: 500 }
    );
  }
}