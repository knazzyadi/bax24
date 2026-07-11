// src/app/api/asset-statuses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';

// GET: جلب قائمة حالات الأصول
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.read');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const statuses = await prisma.assetStatus.findMany({
      where: {
        companyId,
        deletedAt: null, // استبعاد المحذوفين
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        description: true,
        color: true,
        order: true,
        isDefault: true,
        isActive: true,
      },
    });

    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error('GET /api/asset-statuses error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إضافة حالة أصل جديدة
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.create');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const body = await request.json();
    const { name, nameEn, code, description, color, order, isDefault, isActive } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    // التحقق من عدم تكرار الاسم أو الكود
    const existing = await prisma.assetStatus.findFirst({
      where: {
        OR: [
          { name: name.trim(), companyId },
          { code: code?.trim() || undefined, companyId },
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'يوجد حالة بنفس الاسم أو الكود بالفعل' },
        { status: 409 }
      );
    }

    // استخدام transaction لضمان ذرية تحديث isDefault
    const newStatus = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.assetStatus.updateMany({
          where: { companyId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.assetStatus.create({
        data: {
          name: name.trim(),
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          color: color || '#64748b',
          order: typeof order === 'number' ? order : 0,
          isDefault: isDefault === true,
          isActive: isActive ?? true,
          companyId,
        },
      });
    });

    return NextResponse.json(newStatus, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/asset-statuses error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// PUT: تحديث حالة أصل
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.update');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const body = await request.json();
    const { id, name, nameEn, code, description, color, order, isDefault, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    // التحقق من وجود الحالة
    const existing = await prisma.assetStatus.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    // التحقق من عدم تكرار الاسم أو الكود (باستثناء نفس الحالة)
    const duplicate = await prisma.assetStatus.findFirst({
      where: {
        companyId,
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
        { error: 'يوجد حالة بنفس الاسم أو الكود بالفعل' },
        { status: 409 }
      );
    }

    // تحديث داخل transaction
    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.assetStatus.updateMany({
          where: { companyId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.assetStatus.update({
        where: { id },
        data: {
          name: name?.trim() || existing.name,
          nameEn: nameEn?.trim() || null,
          code: code?.trim() || null,
          description: description?.trim() || null,
          color: color || existing.color,
          order: typeof order === 'number' ? order : existing.order,
          isDefault: isDefault === true,
          isActive: isActive ?? existing.isActive,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/asset-statuses error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف حالة أصل (Soft Delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await checkPermission('assets.delete');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const existing = await prisma.assetStatus.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    // منع حذف الحالة الافتراضية (اختياري)
    if (existing.isDefault) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الحالة الافتراضية' },
        { status: 400 }
      );
    }

    // Soft Delete
    await prisma.assetStatus.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/asset-statuses error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}