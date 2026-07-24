// src/app/api/work-order-statuses/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'يجب إرسال مصفوفة من المعرفات' },
        { status: 400 }
      );
    }

    // التحقق من أن جميع المعرفات تنتمي للشركة
    const existingStatuses = await prisma.workOrderStatus.findMany({
      where: {
        id: { in: ids },
        companyId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingStatuses.length !== ids.length) {
      return NextResponse.json(
        { error: 'بعض المعرفات غير صالحة أو لا تنتمي للشركة' },
        { status: 400 }
      );
    }

    // تحديث الترتيب لكل حالة
    await Promise.all(
      ids.map((id: string, index: number) =>
        prisma.workOrderStatus.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

    return NextResponse.json(
      { message: 'تم تحديث الترتيب بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error reordering work order statuses:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الترتيب' },
      { status: 500 }
    );
  }
}