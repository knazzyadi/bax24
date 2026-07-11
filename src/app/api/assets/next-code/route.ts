// src/app/api/assets/next-code/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { generateUniqueAssetCode } from '@/lib/selects/code-generator';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة بالمستخدم' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('typeId');
    const roomId = searchParams.get('roomId');

    if (!typeId || !roomId) {
      return NextResponse.json(
        { error: 'نوع الأصل والغرفة مطلوبان لتوليد الكود' },
        { status: 400 }
      );
    }

    // جلب branchId من الغرفة
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        building: {
          select: { branchId: true },
        },
      },
    });

    if (!room?.building?.branchId) {
      return NextResponse.json(
        { error: 'الغرفة غير مرتبطة بفرع صالح' },
        { status: 400 }
      );
    }

    const branchId = room.building.branchId;

    // ✅ توليد الكود داخل معاملة وإرجاعه مباشرة
    const generatedCode = await prisma.$transaction(async (tx) => {
      return await generateUniqueAssetCode(tx, companyId, branchId, typeId);
    });

    return NextResponse.json({ code: generatedCode });
  } catch (error) {
    console.error('❌ Error generating next code:', error);
    const message = error instanceof Error ? error.message : 'فشل توليد الكود التسلسلي';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}