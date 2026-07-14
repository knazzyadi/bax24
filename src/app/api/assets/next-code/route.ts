// src/app/api/assets/next-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { generateAssetCode } from '@/lib/assets/helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const companyId = session.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const typeId = searchParams.get('typeId');
    const roomId = searchParams.get('roomId');

    if (!typeId || !roomId) {
      return NextResponse.json(
        { error: 'نوع الأصل والغرفة مطلوبان' },
        { status: 400 }
      );
    }

    // ✅ استخدام generateAssetCode مباشرة
    const code = await generateAssetCode(
      typeId,
      roomId,
      companyId
    );

    return NextResponse.json({ code });
  } catch (error) {
    console.error('Error generating next asset code:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في توليد الكود' },
      { status: 500 }
    );
  }
}