import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession, requirePermission } from '@/lib/auth-helper';


export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const branchIds = session.user.branchIds;

    let buildingIdsFilter: string[] | null = null;
    if (!isAdmin && branchIds && branchIds.length > 0) {
      buildingIdsFilter = branchIds;
    } else if (!isAdmin && (!branchIds || branchIds.length === 0)) {
      return NextResponse.json(0);
    }

    const whereOil: any = { status: 'PENDING' };
    if (buildingIdsFilter) {
      whereOil.vehicle = {
        buildingId: { in: buildingIdsFilter },
      };
    }

    // ✅ استخدام النموذج الجديد
    const count = await prisma.oilChangeRequest.count({ where: whereOil });
    return NextResponse.json(count);
  } catch (error) {
    console.error('GET /api/stats/pending-oil-requests error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}