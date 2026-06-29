// src/app/api/buildings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';

export async function GET(request: Request) {
  try {
    // ✅ استخدام الدوال الجديدة
    const session = await getAuthenticatedSession();
    await checkPermission('assets.read');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const userBranchIds = session.branchIds || [];

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
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    }
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}