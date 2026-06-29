// src/app/api/floors/[floorId]/rooms/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ floorId: string }> }
) {
  try {
    // ✅ استخدام getAuthenticatedSession بدلاً من getSession
    const session = await getAuthenticatedSession();
    // ✅ استخدام checkPermission بدلاً من requirePermission
    await checkPermission('assets.read');

    const { floorId } = await params;
    const companyId = session.companyId;
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

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      // التحقق من وجود branchId في المبنى
      if (!floor.building.branchId) {
        return NextResponse.json(
          { error: 'المبنى ليس لديه فرع مرتبط' },
          { status: 400 }
        );
      }
      const userBranchIds = session.branchIds || [];
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
    
    // ✅ معالجة أخطاء المصادقة بشكل موحد
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN' || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error.message },
      { status: 500 }
    );
  }
}