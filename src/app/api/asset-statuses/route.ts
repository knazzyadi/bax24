// src/app/api/asset-statuses/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

// GET: جلب قائمة حالات الأصول (للمستخدمين المصرح لهم assets.read)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    // ✅ السماح لأي مستخدم لديه صلاحية assets.read
    await requirePermission('assets.read', session);

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const statuses = await prisma.assetStatus.findMany({
      where: { companyId },
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
      },
    });
    return NextResponse.json(statuses);
  } catch (error) {
    console.error('GET /api/asset-statuses error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إضافة حالة أصل جديدة (للأدمن فقط)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'لا تملك صلاحية إنشاء حالة' }, { status: 403 });
    }
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { name, nameEn, code, description, color, order, isDefault } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    // التحقق من عدم تكرار الاسم لنفس الشركة
    const existing = await prisma.assetStatus.findFirst({
      where: { name: name.trim(), companyId },
    });
    if (existing) {
      return NextResponse.json(
        { error: `حالة أصل بنفس الاسم "${name}" موجودة بالفعل` },
        { status: 409 }
      );
    }

    // إذا كان isDefault true، إلغاء الافتراضي عن الحالات الأخرى
    if (isDefault === true) {
      await prisma.assetStatus.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newStatus = await prisma.assetStatus.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        description: description?.trim() || null,
        color: color || "#64748b",
        order: typeof order === 'number' ? order : 0,
        isDefault: isDefault === true,
        companyId,
      },
    });

    revalidatePath('/ar/settings/asset-statuses');
    return NextResponse.json(newStatus, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/asset-statuses error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'حالة أصل بنفس الاسم موجودة بالفعل' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// PUT: تحديث حالة (للأدمن فقط)
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) return NextResponse.json({ error: 'لا تملك صلاحية تحديث الحالة' }, { status: 403 });

    const body = await request.json();
    const { id, name, nameEn, code, description, color, order, isDefault } = body;
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });

    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });

    // التحقق من وجود الحالة
    const existing = await prisma.assetStatus.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    // إذا كان isDefault true، إلغاء الافتراضي عن الحالات الأخرى
    if (isDefault === true) {
      await prisma.assetStatus.updateMany({
        where: { companyId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.assetStatus.update({
      where: { id },
      data: {
        name: name?.trim(),
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        description: description?.trim() || null,
        color: color || existing.color,
        order: order ?? existing.order,
        isDefault: isDefault ?? existing.isDefault,
      },
    });

    revalidatePath('/ar/settings/asset-statuses');
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/asset-statuses error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف حالة (للأدمن فقط)
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) return NextResponse.json({ error: 'لا تملك صلاحية حذف الحالة' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });

    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });

    const existing = await prisma.assetStatus.findFirst({
      where: { id, companyId },
    });
    if (!existing) return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });

    await prisma.assetStatus.delete({ where: { id } });
    revalidatePath('/ar/settings/asset-statuses');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/asset-statuses error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}