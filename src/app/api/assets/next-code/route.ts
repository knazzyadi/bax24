// src/app/api/assets/next-code/route.ts
import { NextResponse } from 'next/server';

import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';



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

    // جلب أعلى كود تسلسلي مستخدم في الشركة
    const lastAsset = await prisma.asset.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let lastNumber = 0;
    if (lastAsset?.code) {
      // نفترض أن الكود أصبح مجرد رقم (بدون أحرف)
      const num = parseInt(lastAsset.code, 10);
      if (!isNaN(num)) lastNumber = num;
    }
    const nextNumber = lastNumber + 1;
    const nextCode = nextNumber.toString(); // رقم تسلسلي بسيط

    return NextResponse.json({ code: nextCode });
  } catch (error: any) {
    console.error('❌ Error generating next code:', error);
    return NextResponse.json(
      { error: 'فشل توليد الكود التسلسلي', details: error.message },
      { status: 500 }
    );
  }
}