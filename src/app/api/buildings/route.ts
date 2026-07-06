// src/app/api/buildings/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // ✅ استخدام try-catch داخلي
    let session;
    try {
      session = await getAuthenticatedSession();
    } catch {
      // إذا فشلت المصادقة، نعيد مصفوفة فارغة
      return NextResponse.json([]);
    }

    if (!session) {
      return NextResponse.json([]);
    }

    // ✅ استخدام خصائص AuthSession مباشرة (بدون session.user)
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json([]);
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const userBranchIds = session.branchIds || [];

    let where: any = { companyId };

    if (!isAdmin && userBranchIds.length > 0) {
      where.branchId = { in: userBranchIds };
    } else if (!isAdmin && userBranchIds.length === 0) {
      return NextResponse.json([]);
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
    return NextResponse.json([]);
  }
}