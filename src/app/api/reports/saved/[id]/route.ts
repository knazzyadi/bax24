// src/app/api/reports/saved/[id]/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';


// DELETE: حذف تقرير محفوظ
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.savedReport.findFirst({
      where: {
        id,
        userId: session.id,
        companyId: session.companyId!,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    await prisma.savedReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/reports/saved/[id] error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}