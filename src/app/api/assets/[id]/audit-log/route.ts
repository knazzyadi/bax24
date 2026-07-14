// src/app/api/assets/[id]/audit-log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    // ✅ تحقق من وجود الأصل
    const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, companyId: true },
    });
    if (!asset) {
      return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
    }

    // ✅ تحقق من أن الأصل ينتمي لنفس الشركة
    if (asset.companyId !== session.companyId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(Number(searchParams.get('page')) || 1, 1);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { assetId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        // ✅ بدون include user لتجنب أخطاء العلاقة إذا لم تكن موجودة
      }),
      prisma.auditLog.count({ where: { assetId: id } }),
    ]);

    return NextResponse.json({
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('❌ Error in audit-log API:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجل التدقيق' },
      { status: 500 }
    );
  }
}