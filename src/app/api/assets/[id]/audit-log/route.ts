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
    const companyId = session.companyId;

    // التحقق من وجود الأصل
    const asset = await prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true },
    });

    if (!asset) {
      return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });
    }

    const logs = await prisma.auditLog.findMany({
      where: { assetId: id },
      orderBy: { createdAt: 'desc' },
      take: 50, // آخر 50 سجل
      select: {
        id: true,
        action: true,
        userEmail: true,
        changes: true,
        createdAt: true,
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('GET /api/assets/[id]/audit-log error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}