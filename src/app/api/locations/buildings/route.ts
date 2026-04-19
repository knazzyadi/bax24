import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role || '')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // إذا كان المستخدم أدمن شركة، نعرض فقط المباني التابعة لشركته
  const where = session.user?.role === 'ADMIN' && session.user?.companyId
    ? { companyId: session.user.companyId }
    : {};

  const buildings = await prisma.building.findMany({
    where,
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(buildings);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role || '')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { name, nameEn, code, order } = await request.json();
  if (!name || !code) {
    return NextResponse.json({ error: 'الاسم والرمز مطلوبان' }, { status: 400 });
  }

  // لأدمن الشركة، نربط المبنى بشركته تلقائياً
  const companyId = session.user?.role === 'ADMIN' ? session.user.companyId : null;

  const building = await prisma.building.create({
    data: {
      name,
      nameEn: nameEn || null,
      code,
      order: order || 0,
      companyId,
    },
  });
  return NextResponse.json(building, { status: 201 });
}