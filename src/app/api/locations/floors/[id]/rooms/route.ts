// src/app/api/locations/floors/[id]/rooms/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ تغيير floorId → id
) {
  try {
    const session = await getAuthenticatedSession();
    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json([]);
    }

    const { id } = await params; // ✅ استخراج id بدلاً من floorId

    // جلب الدور مع المبنى والفرع للتحقق من الملكية
    const floor = await prisma.floor.findUnique({
      where: { id }, // ✅ استخدام id
      include: {
        building: {
          include: { branch: true },
        },
      },
    });

    if (!floor || !floor.building || !floor.building.branch || floor.building.branch.companyId !== companyId) {
      return NextResponse.json([]);
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      if (!floor.building.branchId || !userBranchIds.includes(floor.building.branchId)) {
        return NextResponse.json([]);
      }
    }

    const rooms = await prisma.room.findMany({
      where: { floorId: id }, // ✅ استخدام id في where
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        floorId: true,
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('GET /api/locations/floors/[id]/rooms error:', error);
    return NextResponse.json([]);
  }
}