// src/app/api/locations/buildings/[id]/floors/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ تغيير buildingId → id
) {
  try {
    const session = await getAuthenticatedSession();
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json([]);
    }

    const { id } = await params; // ✅ استخراج id بدلاً من buildingId

    // جلب المبنى مع الفرع للتحقق من الملكية
    const building = await prisma.building.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!building || !building.branch || building.branch.companyId !== companyId) {
      return NextResponse.json([]);
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      if (!building.branchId || !userBranchIds.includes(building.branchId)) {
        return NextResponse.json([]);
      }
    }

    const floors = await prisma.floor.findMany({
      where: { buildingId: id }, // ✅ استخدام id مباشرة في where
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        order: true,
        buildingId: true,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(floors);
  } catch (error) {
    console.error('GET /api/locations/buildings/[id]/floors error:', error);
    return NextResponse.json([]);
  }
}