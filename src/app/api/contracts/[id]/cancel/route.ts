//contracts/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ استخدام requirePermission للتحقق من الصلاحية والحصول على الجلسة معاً
    const session = await requirePermission('contracts.update');
    // الآن الجلسة مضمونة والصلاحية مؤكدة

    const { id } = await params;
    const { reason } = await request.json();
    const companyId = session.companyId!;

    const contract = await prisma.contract.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!contract) {
      return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });
    }
    if (contract.status !== 'ACTIVE' && contract.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'لا يمكن فسخ عقد غير نشط أو قيد المراجعة' },
        { status: 400 }
      );
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: 'CANCELLED', cancellationReason: reason },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطأ في فسخ العقد' }, { status: 500 });
  }
}