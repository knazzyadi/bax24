// src/app/api/locations/rooms/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession, requirePermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// واجهة بيانات إنشاء غرفة
interface CreateRoomBody {
  name: string;
  nameEn?: string;
  code: string;
  order?: number;
  floorId: string;
  buildingId: string;
}

// ============================================================
// GET: جلب جميع الغرف الخاصة بمباني الشركة
// ============================================================
export async function GET() {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await requirePermission('locations.read');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بهذا الحساب' }, { status: 400 });
    }

    const rooms = await prisma.room.findMany({
      where: {
        building: { companyId },
      },
      include: {
        floor: {
          include: {
            building: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error: unknown) {
    console.error('GET /api/locations/rooms error:', error);
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ============================================================
// POST: إضافة غرفة جديدة
// ============================================================
export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await requirePermission('locations.create');

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    // استلام البيانات مع تحديد النوع
    const body = (await request.json()) as CreateRoomBody;
    const { name, nameEn, code, order, floorId, buildingId } = body;

    if (!name || !code || !floorId || !buildingId) {
      return NextResponse.json(
        { error: 'الاسم، الكود، الدور، والمبنى مطلوبون' },
        { status: 400 }
      );
    }

    // التأكد أن المبنى ينتمي للشركة
    const building = await prisma.building.findFirst({
      where: { id: buildingId, companyId },
    });
    if (!building) {
      return NextResponse.json(
        { error: 'المبنى غير موجود أو لا ينتمي لشركتك' },
        { status: 403 }
      );
    }

    // التأكد أن الدور ينتمي للمبنى
    const floor = await prisma.floor.findFirst({
      where: { id: floorId, buildingId },
    });
    if (!floor) {
      return NextResponse.json(
        { error: 'الدور غير موجود أو لا ينتمي لهذا المبنى' },
        { status: 400 }
      );
    }

    // ✅ التحقق من عدم تكرار الكود في نفس المبنى (بدون deletedAt)
    const existing = await prisma.room.findFirst({
      where: {
        buildingId,
        code: code.trim(),
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'الكود موجود مسبقاً في هذا المبنى' },
        { status: 409 }
      );
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        code: code.trim(),
        order: order || 0,
        floorId,
        buildingId,
      },
    });

    revalidatePath('/ar/locations/rooms');
    return NextResponse.json(room, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/locations/rooms error:', error);
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'لا تملك الصلاحية' }, { status: 403 });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}