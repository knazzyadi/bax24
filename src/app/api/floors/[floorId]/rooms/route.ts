import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession, requirePermission } from '@/lib/auth-helper';



export async function GET(
  request: Request,
  { params }: { params: Promise<{ floorId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await requirePermission('assets.read');

    const { floorId } = await params;
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // جلب الدور مع المبنى والفرع للتحقق
    const floor = await prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        building: {
          include: { branch: true },
        },
      },
    });

    if (!floor) {
      return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 });
    }

    // التحقق من وجود الفرع
    if (!floor.building.branch) {
      return NextResponse.json(
        { error: 'المبنى ليس لديه فرع مرتبط' },
        { status: 400 }
      );
    }

    // التحقق من انتماء المبنى للشركة
    if (floor.building.branch.companyId !== companyId) {
      return NextResponse.json({ error: 'هذا الدور لا ينتمي لشركتك' }, { status: 403 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      // التحقق من وجود branchId في المبنى
      if (!floor.building.branchId) {
        return NextResponse.json(
          { error: 'المبنى ليس لديه فرع مرتبط' },
          { status: 400 }
        );
      }
      const userBranchIds = session.user.branchIds || [];
      if (!userBranchIds.includes(floor.building.branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية الوصول لهذا الفرع' }, { status: 403 });
      }
    }

    const rooms = await prisma.room.findMany({
      where: { floorId: floor.id },
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
  } catch (error: any) {
    console.error('GET /api/floors/[floorId]/rooms error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}