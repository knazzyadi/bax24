// src/app/api/buildings/[buildingId]/floors/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  try {
    // ✅ استخدام getAuthenticatedSession بدلاً من getSession
    const session = await getAuthenticatedSession();
    // ✅ استخدام checkPermission بدلاً من requirePermission
    await checkPermission('assets.read');

    const { buildingId } = await params;
    const companyId = session.companyId;
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

    // التحقق من وجود الفرع
    if (!building.branch) {
      return NextResponse.json(
        { error: 'المبنى ليس لديه فرع مرتبط' },
        { status: 400 }
      );
    }

    // التحقق من أن المبنى يتبع نفس الشركة
    if (building.branch.companyId !== companyId) {
      return NextResponse.json({ error: 'المبنى لا ينتمي لشركتك' }, { status: 403 });
    }

    // التحقق من أن المستخدم يملك صلاحية على هذا الفرع (إذا لم يكن ADMIN)
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      // التأكد من أن building.branchId ليس null
      if (!building.branchId) {
        return NextResponse.json(
          { error: 'المبنى ليس لديه فرع مرتبط' },
          { status: 400 }
        );
      }
      const userBranchIds = session.branchIds || [];
      if (!userBranchIds.includes(building.branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية الوصول لهذا الفرع' }, { status: 403 });
      }
    }

    // جلب الطوابق مرتبة حسب order
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