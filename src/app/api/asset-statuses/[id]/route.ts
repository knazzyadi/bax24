import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

// GET: جلب حالة أصل واحدة (لجميع المستخدمين المصرح لهم بقراءة الأصول)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('assets.read', session);

    const { id } = await params;
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const status = await prisma.assetStatus.findFirst({
      where: { id, companyId },
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

    if (!status) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('GET /api/asset-statuses/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// PUT: تحديث حالة أصل (للأدمن فقط)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'لا تملك صلاحية تعديل الحالات' }, { status: 403 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { id } = await params;
    const { name, nameEn, code, description, color, order, isDefault } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    const existing = await prisma.assetStatus.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    // التحقق من عدم تكرار الاسم (باستثناء نفس الحالة)
    const duplicate = await prisma.assetStatus.findFirst({
      where: {
        name: name.trim(),
        companyId,
        NOT: { id },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: `حالة أصل بنفس الاسم "${name}" موجودة بالفعل` },
        { status: 409 }
      );
    }

    // إذا تم تعيين الحالة كافتراضية، قم بإلغاء الافتراضية عن الحالات الأخرى
    if (isDefault === true && !existing.isDefault) {
      await prisma.assetStatus.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.assetStatus.update({
      where: { id },
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        description: description?.trim() || null,
        color: color || "#64748b",
        order: typeof order === 'number' ? order : 0,
        isDefault: isDefault === true,
      },
    });

    // إعادة التحقق من مسار الصفحة (يمكن تحسينه لاحقاً ليدعم اللغة)
    revalidatePath('/ar/settings/asset-statuses');
    revalidatePath('/en/settings/asset-statuses');
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/asset-statuses/[id] error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'حالة أصل بنفس الاسم موجودة بالفعل' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE: حذف حالة أصل (للأدمن فقط)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'لا تملك صلاحية حذف الحالات' }, { status: 403 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const { id } = await params;
    const status = await prisma.assetStatus.findFirst({
      where: { id, companyId },
    });
    if (!status) {
      return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 });
    }

    // TODO: التحقق من وجود أصول مرتبطة بهذه الحالة (يمكن إضافته لاحقاً)

    await prisma.assetStatus.delete({ where: { id } });
    revalidatePath('/ar/settings/asset-statuses');
    revalidatePath('/en/settings/asset-statuses');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/asset-statuses/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}