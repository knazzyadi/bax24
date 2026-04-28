import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

// GET: List all priorities for the user's company
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('work_orders.read', session);

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const priorities = await prisma.workOrderPriority.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(priorities);
  } catch (error: any) {
    console.error('GET priorities error:', error);
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST: Create a new priority
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Only ADMIN or SUPER_ADMIN can create
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }

    const body = await request.json();
    const { name, nameEn, order, isDefault, color } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await prisma.workOrderPriority.findFirst({
      where: { name: name.trim(), companyId },
    });
    if (existing) {
      return NextResponse.json({ error: 'أولوية بنفس الاسم موجودة مسبقاً' }, { status: 409 });
    }

    // If this priority is default, unset others
    if (isDefault === true) {
      await prisma.workOrderPriority.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newPriority = await prisma.workOrderPriority.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        order: typeof order === 'number' ? order : 0,
        isDefault: isDefault === true,
        color: color || '#64748b',
        companyId,
      },
    });

    return NextResponse.json(newPriority, { status: 201 });
  } catch (error: any) {
    console.error('POST priority error:', error);
    return NextResponse.json({ error: 'فشل إنشاء الأولوية' }, { status: 500 });
  }
}