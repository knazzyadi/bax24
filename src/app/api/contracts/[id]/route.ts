// src/app/api/contracts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedSession, requirePermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { deleteFileFromR2 } from '@/lib/storage';

type ContractBody = {
  title: string;
  supplier: string;
  value?: number;
  startDate: string;
  endDate: string;
  description?: string;
  notes?: string;
  buildingId?: string | null;
  attachmentIds?: string[];
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
};

type ContractAttachment = {
  id: string;
  key: string;
};

// GET: جلب عقد واحد مع مرفقاته وحقول المندوب
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await requirePermission('contracts.read');

    const { id } = await params;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        branch: true,
        attachments: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'العقد غير موجود' },
        { status: 404 }
      );
    }

    const isAdmin =
      session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];

      if (
        !contract.branchId ||
        !userBranchIds.includes(contract.branchId)
      ) {
        return NextResponse.json(
          { error: 'غير مصرح بالوصول إلى هذا العقد' },
          { status: 403 }
        );
      }
    }

    const serialized = {
      ...contract,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate.toISOString().split('T')[0],
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      agentName: contract.agentName ?? null,
      agentPhone: contract.agentPhone ?? null,
      agentEmail: contract.agentEmail ?? null,
    };

    return NextResponse.json(serialized);
  } catch (error: unknown) {
    console.error('GET /api/contracts/[id] error:', error);

    return NextResponse.json(
      { error: 'خطأ في جلب العقد' },
      { status: 500 }
    );
  }
}

// PUT: تحديث عقد
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await requirePermission('contracts.update');

    const { id } = await params;

    const body: ContractBody = await request.json();

    const {
      title,
      supplier,
      value,
      startDate,
      endDate,
      description,
      notes,
      buildingId,
      attachmentIds,
      agentName,
      agentPhone,
      agentEmail,
    } = body;

    if (!title || !supplier || !startDate || !endDate) {
      return NextResponse.json(
        {
          error: 'العنوان، المورد، وتاريخي البداية والنهاية مطلوبة',
        },
        { status: 400 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const existing = await prisma.contract.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      select: {
        branchId: true,
        attachments: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'العقد غير موجود' },
        { status: 404 }
      );
    }

    let branchId = existing.branchId;

    if (buildingId !== undefined) {
      if (buildingId === null || buildingId === '') {
        branchId = null;
      } else {
        const building = await prisma.building.findUnique({
          where: { id: buildingId },
          select: { branchId: true },
        });

        if (!building) {
          return NextResponse.json(
            { error: 'المبنى المختار غير موجود' },
            { status: 400 }
          );
        }

        branchId = building.branchId;
      }
    }

    const isAdmin =
      session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    if (!isAdmin && branchId) {
      const userBranchIds = session.branchIds || [];

      if (!userBranchIds.includes(branchId)) {
        return NextResponse.json(
          { error: 'لا تملك صلاحية تعديل عقد لهذا الفرع' },
          { status: 403 }
        );
      }
    }

    if (Array.isArray(attachmentIds)) {
      const currentAttachments: ContractAttachment[] =
        existing.attachments;

      const toKeepIds = attachmentIds.filter((attachmentId) =>
        currentAttachments.some(
          (attachment) => attachment.id === attachmentId
        )
      );

      const toRemove = currentAttachments.filter(
        (attachment) => !attachmentIds.includes(attachment.id)
      );

      for (const attachment of toRemove) {
        await deleteFileFromR2(attachment.key);

        await prisma.contractAttachment.delete({
          where: {
            id: attachment.id,
          },
        });
      }

      const newAttachmentIds = attachmentIds.filter(
        (attachmentId) => !toKeepIds.includes(attachmentId)
      );

      if (newAttachmentIds.length > 0) {
        await prisma.contractAttachment.updateMany({
          where: {
            id: {
              in: newAttachmentIds,
            },
          },
          data: {
            contractId: id,
          },
        });
      }
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        title,
        supplier,
        value,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description ?? null,
        notes: notes ?? null,
        branchId,
        agentName: agentName ?? null,
        agentPhone: agentPhone ?? null,
        agentEmail: agentEmail ?? null,
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('PUT /api/contracts/[id] error:', error);

    return NextResponse.json(
      { error: 'خطأ في تحديث العقد' },
      { status: 500 }
    );
  }
}

// DELETE: حذف ناعم للعقد
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await requirePermission('contracts.delete');

    const { id } = await params;
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const existing = await prisma.contract.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        attachments: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'العقد غير موجود' },
        { status: 404 }
      );
    }

    const isAdmin =
      session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    if (!isAdmin && existing.branchId) {
      const userBranchIds = session.branchIds || [];

      if (!userBranchIds.includes(existing.branchId)) {
        return NextResponse.json(
          { error: 'لا تملك صلاحية حذف هذا العقد' },
          { status: 403 }
        );
      }
    }

    for (const attachment of existing.attachments) {
      await deleteFileFromR2(attachment.key);

      await prisma.contractAttachment.delete({
        where: {
          id: attachment.id,
        },
      });
    }

    await prisma.contract.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/contracts/[id] error:', error);

    return NextResponse.json(
      { error: 'خطأ في حذف العقد' },
      { status: 500 }
    );
  }
}