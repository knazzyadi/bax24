import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// GET: جلب جميع الأدوار (لأدمن الشركة فقط الأدوار التابعة لمباني شركته)
// يدعم فلترة حسب buildingId عبر query parameter
export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const buildingId = searchParams.get('buildingId');

  // بناء شرط التصفية
  let where: any = {};
  if (buildingId) {
    where.buildingId = buildingId;
  }

  // لأدمن الشركة: تقييد الأدوار بالمباني التابعة لشركته
  if (session.user?.role === 'ADMIN' && session.user?.companyId) {
    const buildings = await prisma.building.findMany({
      where: { companyId: session.user.companyId },
      select: { id: true },
    });
    const buildingIds = buildings.map(b => b.id);
    where.buildingId = { in: buildingIds };
    
    // إذا تم تمرير buildingId لا يتبع الشركة، نعيد مصفوفة فارغة
    if (buildingId && !buildingIds.includes(buildingId)) {
      return NextResponse.json([]);
    }
  }

  const floors = await prisma.floor.findMany({
    where,
    include: { building: true },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(floors);
}

// POST: إضافة دور جديد
export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { name, nameEn, code, order, buildingId } = await request.json();
  if (!name || !code || !buildingId) {
    return NextResponse.json({ error: 'الاسم، الكود، والمبنى مطلوبون' }, { status: 400 });
  }

  // لأدمن الشركة: التأكد من أن المبنى يتبع شركته
  if (session.user?.role === 'ADMIN') {
    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (!building || building.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'لا يمكنك إضافة دور لمبنى ليس ضمن شركتك' }, { status: 403 });
    }
  }

  const floor = await prisma.floor.create({
    data: {
      name,
      nameEn: nameEn || null,
      code,
      order: order || 0,
      buildingId,
    },
  });
  return NextResponse.json(floor, { status: 201 });
}