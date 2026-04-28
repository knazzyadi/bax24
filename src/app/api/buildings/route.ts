import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await requirePermission('assets.read', session);

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const userBranchIds = session.user.branchIds || [];

    let where: any = {
      branch: {
        companyId: companyId,
      },
    };

    if (!isAdmin && userBranchIds.length > 0) {
      where.branchId = { in: userBranchIds };
    } else if (!isAdmin) {
      return NextResponse.json([]); // لا فروع متاحة
    }

    const buildings = await prisma.building.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        branchId: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(buildings);
  } catch (error: any) {
    console.error('GET /api/buildings error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}