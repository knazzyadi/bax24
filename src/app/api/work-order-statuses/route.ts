// src/app/api/work-order-statuses/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

// GET: جلب قائمة الحالات (مع صلاحية work_orders.read أو work_orders.create)
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // تحقق من صلاحية قراءة أو إنشاء أوامر العمل (حسب استخدامك)
    await requirePermission('work_orders.read', session);

    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');

    let where: any = {};
    if (session.user.role !== 'SUPER_ADMIN') {
      where.companyId = session.user.companyId;
    } else if (companyIdParam) {
      where.companyId = companyIdParam;
    }

    const statuses = await prisma.workOrderStatus.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error('GET /api/work-order-statuses error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إضافة حالة جديدة (يتطلب صلاحية admin أو settings.manage)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // صلاحية إدارة الحالات (يمكنك إضافتها في الـ RBAC)
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    const isAdmin = session.user.role === 'ADMIN';

    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }

    const body = await request.json();
    const { name, nameEn, color, order, isDefault, companyId } = body; // ✅ removed description

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    let targetCompanyId = companyId;
    if (isAdmin && !isSuperAdmin) {
      targetCompanyId = session.user.companyId;
    }
    if (!targetCompanyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // التحقق من عدم تكرار الاسم
    const existing = await prisma.workOrderStatus.findFirst({
      where: { name: name.trim(), companyId: targetCompanyId },
    });
    if (existing) {
      return NextResponse.json({ error: 'حالة بنفس الاسم موجودة مسبقاً' }, { status: 409 });
    }

    // إذا كان isDefault == true، قم بإلغاء الافتراضي عن الآخرين
    if (isDefault === true) {
      await prisma.workOrderStatus.updateMany({
        where: { companyId: targetCompanyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newStatus = await prisma.workOrderStatus.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        color: color || '#64748b',
        order: typeof order === 'number' ? order : 0,
        isDefault: isDefault === true,
        companyId: targetCompanyId,
      },
    });

    return NextResponse.json(newStatus, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/work-order-statuses error:', error);
    return NextResponse.json({ error: 'خطأ في الإنشاء' }, { status: 500 });
  }
}