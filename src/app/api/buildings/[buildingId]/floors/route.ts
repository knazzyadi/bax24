import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await requirePermission('assets.read', session);

    const { buildingId } = await params;
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // جلب المبنى مع الفرع الخاص به
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: { branch: true },
    });

    if (!building) {
      return NextResponse.json({ error: 'المبنى غير موجود' }, { status: 404 });
    }

    // التحقق من أن المبنى يتبع نفس الشركة
    if (building.branch.companyId !== companyId) {
      return NextResponse.json({ error: 'المبنى لا ينتمي لشركتك' }, { status: 403 });
    }

    // التحقق من أن المستخدم يملك صلاحية على هذا الفرع (إذا لم يكن ADMIN)
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.user.branchIds || [];
      if (!userBranchIds.includes(building.branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية الوصول لهذا الفرع' }, { status: 403 });
      }
    }

    // جلب الأدوار مرتبة حسب order
    const floors = await prisma.floor.findMany({
      where: { buildingId: building.id },
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
  } catch (error: any) {
    console.error('GET /api/buildings/[buildingId]/floors error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}