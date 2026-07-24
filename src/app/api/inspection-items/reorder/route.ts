// src/app/api/inspection-items/reorder/route.ts
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

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'قائمة المعرفات غير صالحة' },
        { status: 400 }
      );
    }

    await Promise.all(
      ids.map((id, index) =>
        prisma.inspectionItem.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    return NextResponse.json({ message: 'تم تحديث ترتيب البنود بنجاح' });
  } catch (error) {
    console.error('Error reordering inspection items:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث ترتيب البنود' },
      { status: 500 }
    );
  }
}