// src/app/api/assets/next-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
// ✅ تغيير الاستيراد إلى دالة المعاينة
import { generateAssetPreviewCode } from '@/lib/selects/code-preview';
import { AssetBusinessError } from '@/lib/assets/errors';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('typeId');
    const roomId = searchParams.get('roomId');

    if (!typeId) {
      return NextResponse.json(
        { error: 'نوع الأصل مطلوب' },
        { status: 400 }
      );
    }
    if (!roomId) {
      return NextResponse.json(
        { error: 'الغرفة مطلوبة' },
        { status: 400 }
      );
    }

    // جلب تفاصيل الغرفة لاستخراج branchId
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        floor: {
          include: {
            building: {
              select: {
                branchId: true,
              },
            },
          },
        },
      },
    });

    if (!room?.floor?.building?.branchId) {
      return NextResponse.json(
        { error: 'الغرفة غير مرتبطة بفرع' },
        { status: 400 }
      );
    }

    const branchId = room.floor.building.branchId;

    // ✅ استخدام دالة المعاينة (لا تحدث العداد)
    const code = await generateAssetPreviewCode(
      branchId,
      typeId
    );

    return NextResponse.json({ code });
  } catch (error) {
    console.error('❌ Error generating asset preview code:', error);
    if (error instanceof AssetBusinessError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ في توليد الكود' },
      { status: 500 }
    );
  }
}