// src/app/api/stats/work-orders-count/route.ts

import { NextResponse } from 'next/server';

import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const isAdmin =
      session.role === 'ADMIN' ||
      session.role === 'SUPER_ADMIN';

    const branchIds = session.branchIds ?? [];

    if (!isAdmin && branchIds.length === 0) {
      return NextResponse.json(0);
    }

    const where: Prisma.WorkOrderWhereInput = {
      companyId,
      deletedAt: null,
    };

    if (!isAdmin) {
      where.buildingId = {
        in: branchIds,
      };
    }

    const count = await prisma.workOrder.count({
      where,
    });

    return NextResponse.json(count);
  } catch (error: unknown) {
    console.error(
      'GET /api/stats/work-orders-count error:',
      error
    );

    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}