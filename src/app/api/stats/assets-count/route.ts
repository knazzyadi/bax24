import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const branchIds = session.user.branchIds || [];

    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (!isAdmin) {
      if (branchIds.length === 0) {
        // لا فروع متاحة للمستخدم ⇒ لا يرى أي أصول
        return NextResponse.json({ count: 0 });
      }
      // فلترة الأصول حسب الفرع عبر العلاقة asset -> room -> floor -> building -> branchId
      where.room = {
        floor: {
          building: {
            branchId: { in: branchIds }
          }
        }
      };
    }

    const count = await prisma.asset.count({ where });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('GET /api/stats/assets-count error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}