import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const branchIds = session.user.branchIds;

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (!isAdmin && branchIds && branchIds.length > 0) {
      where.buildingId = { in: branchIds };
    } else if (!isAdmin && (!branchIds || branchIds.length === 0)) {
      return NextResponse.json(0);
    }

    const count = await prisma.workOrder.count({ where });
    return NextResponse.json(count);
  } catch (error) {
    console.error('GET /api/stats/work-orders-count error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}