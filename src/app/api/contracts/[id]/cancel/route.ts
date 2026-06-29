import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';




export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await checkPermission('contracts.update');

    const { id } = await params;
    const { reason } = await request.json();
    const companyId = session.companyId!;

    const contract = await prisma.contract.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!contract) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });
    if (contract.status !== 'ACTIVE' && contract.status !== 'PENDING_REVIEW') {
      return NextResponse.json({ error: 'لا يمكن فسخ عقد غير نشط أو قيد المراجعة' }, { status: 400 });
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