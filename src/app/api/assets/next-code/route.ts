// src/app/api/assets/next-code/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بالمستخدم' }, { status: 400 });
    }

    const url = new URL(request.url);
    const typeId = url.searchParams.get('typeId');
    const roomId = url.searchParams.get('roomId');

    if (!typeId) {
      return NextResponse.json({ error: 'نوع الأصل مطلوب' }, { status: 400 });
    }
    if (!roomId) {
      return NextResponse.json({ error: 'الغرفة مطلوبة لتوليد الكود' }, { status: 400 });
    }

    // 1. جلب بيانات الغرفة + المبنى + الفرع
    const roomData = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        building: {
          include: {
            branch: {
              select: { id: true, code: true },
            },
          },
        },
      },
    });

    if (!roomData) {
      return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
    }

    const branchId = roomData.building.branchId;
    const branchCode = roomData.building.branch?.code?.trim().toUpperCase() || 'BR';

    if (!branchId) {
      return NextResponse.json({ error: 'المبنى ليس له فرع مرتبط' }, { status: 400 });
    }

    // 2. جلب بادئة نوع الأصل
    const assetType = await prisma.assetType.findUnique({
      where: { id: typeId },
      select: { code: true },
    });
    const typePrefix = assetType?.code?.trim().toUpperCase() || 'AST';

    // 3. استخدام الـ Counter الخاص بـ (typeId, branchId) كما في Bulk
    const counter = await prisma.assetCounter.upsert({
      where: {
        typeId_branchId: {
          typeId: typeId,
          branchId: branchId,
        },
      },
      update: { lastValue: { increment: 1 } },
      create: { typeId: typeId, branchId: branchId, lastValue: 1 },
    });

    const seqNumber = counter.lastValue;
    const paddedNumber = seqNumber.toString().padStart(4, '0');
    const code = `${branchCode}-${typePrefix}-${paddedNumber}`;

    return NextResponse.json({ code });
  } catch (error: any) {
    console.error('❌ Error generating next code:', error);
    return NextResponse.json(
      { error: 'فشل توليد الكود التسلسلي', details: error.message },
      { status: 500 }
    );
  }
}