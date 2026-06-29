import { NextResponse } from 'next/server';

import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';


import { revalidatePath } from 'next/cache';

// GET: جلب الأدوار (يمكن فلترتها حسب buildingId)
export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بهذا الحساب' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    const where: any = {
      building: {
        companyId: companyId,
      },
    };
    if (buildingId) {
      where.buildingId = buildingId;
    }

    const floors = await prisma.floor.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        order: true,
        buildingId: true,
        building: {
          select: {
            id: true,
            name: true,
            nameEn: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(floors);
  } catch (error) {
    console.error('GET /api/locations/floors error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST: إضافة دور جديد (للمدير فقط) - بدون تغيير
export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بهذا الحساب' }, { status: 400 });
    }

    const { name, nameEn, code, order, buildingId } = await request.json();
    if (!name || !code || !buildingId) {
      return NextResponse.json(
        { error: 'الاسم، الكود، والمبنى مطلوبون' },
        { status: 400 }
      );
    }

    const building = await prisma.building.findFirst({
      where: { id: buildingId, companyId },
    });
    if (!building) {
      return NextResponse.json(
        { error: 'المبنى غير موجود أو لا ينتمي لشركتك' },
        { status: 404 }
      );
    }

    const existingFloor = await prisma.floor.findFirst({
      where: { buildingId, code },
    });
    if (existingFloor) {
      return NextResponse.json(
        { error: 'الكود موجود مسبقاً في هذا المبنى' },
        { status: 409 }
      );
    }

    const newFloor = await prisma.floor.create({
      data: {
        name,
        nameEn: nameEn || null,
        code,
        order: order || 0,
        buildingId,
      },
    });

    revalidatePath('/ar/locations/floors');
    return NextResponse.json(newFloor, { status: 201 });
  } catch (error) {
    console.error('POST /api/locations/floors error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}