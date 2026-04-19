import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// GET: جلب جميع الغرف (لأدمن الشركة فقط الغرف التابعة لمباني شركته)
export async function GET() {
  const session = await auth();
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let rooms;
  if (session.user?.role === 'ADMIN' && session.user?.companyId) {
    // جلب المباني التابعة للشركة ثم الغرف المرتبطة بها
    const buildings = await prisma.building.findMany({
      where: { companyId: session.user.companyId },
      select: { id: true },
    });
    const buildingIds = buildings.map(b => b.id);
    rooms = await prisma.room.findMany({
      where: { buildingId: { in: buildingIds } },
      include: { floor: true, building: true },
      orderBy: { order: 'asc' },
    });
  } else {
    rooms = await prisma.room.findMany({
      include: { floor: true, building: true },
      orderBy: { order: 'asc' },
    });
  }
  return NextResponse.json(rooms);
}

// POST: إضافة غرفة جديدة
export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { name, nameEn, code, order, floorId, buildingId } = await request.json();
  if (!name || !code || !floorId || !buildingId) {
    return NextResponse.json({ error: 'الاسم، الكود، الدور، والمبنى مطلوبون' }, { status: 400 });
  }

  // لأدمن الشركة: التأكد من أن المبنى يتبع شركته
  if (session.user?.role === 'ADMIN') {
    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (!building || building.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'لا يمكنك إضافة غرفة لمبنى ليس ضمن شركتك' }, { status: 403 });
    }
  }

  const room = await prisma.room.create({
    data: {
      name,
      nameEn: nameEn || null,
      code,
      order: order || 0,
      floorId,
      buildingId,
    },
  });
  return NextResponse.json(room, { status: 201 });
}