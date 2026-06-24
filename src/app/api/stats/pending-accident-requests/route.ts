// src/app/api/stats/pending-accident-requests/route.ts
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

    const whereAccident: any = { status: 'PENDING' };
    if (buildingIdsFilter) {
      whereAccident.vehicle = {
        buildingId: { in: buildingIdsFilter },
      };
    }

    // ✅ استخدام النموذج الصحيح من Prisma
    const count = await prisma.accidentRequest.count({ where: whereAccident });
    return NextResponse.json(count);
  } catch (error) {
    console.error('GET /api/stats/pending-accident-requests error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}