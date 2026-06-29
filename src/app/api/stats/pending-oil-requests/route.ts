import { NextResponse } from 'next/server';

import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';



export async function GET() {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const branchIds = session.branchIds;

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