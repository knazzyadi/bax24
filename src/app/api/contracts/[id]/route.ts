// src/app/api/contracts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedSession, checkPermission } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';



import { deleteFileFromR2 } from '@/lib/storage';

// GET: جلب عقد واحد مع مرفقاته وحقول المندوب
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await checkPermission('contracts.read');

    const { id } = await params;
    const companyId = session.companyId;
    if (!companyId) return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });

    const contract = await prisma.contract.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        branch: true,
        attachments: true,
      },
    });

    if (!contract) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });

    // التحقق من صلاحية الفرع للمستخدمين غير الأدمن
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.branchIds || [];
      const contractBranchId = contract.branchId;
      if (!contractBranchId || !userBranchIds.includes(contractBranchId)) {
        return NextResponse.json({ error: 'غير مصرح بالوصول إلى هذا العقد' }, { status: 403 });
      }
    }

    const serialized = {
      ...contract,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate.toISOString().split('T')[0],
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      // ✅ تضمين حقول المندوب (الموجودة في الـ model)
      agentName: contract.agentName || null,
      agentPhone: contract.agentPhone || null,
      agentEmail: contract.agentEmail || null,
    };

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error('GET /api/contracts/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في جلب العقد' }, { status: 500 });
  }
}

// PUT: تحديث عقد (يدعم تحديث المرفقات وحقول المندوب)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await checkPermission('contracts.update');

    const { id } = await params;
    const body = await request.json();
    const { 
      title, supplier, value, startDate, endDate, description, notes, 
      buildingId, attachmentIds,
      agentName, agentPhone, agentEmail  // ✅ إضافة حقول المندوب
    } = body;

    if (!title || !supplier || !startDate || !endDate) {
      return NextResponse.json({ error: 'العنوان، المورد، وتاريخي البداية والنهاية مطلوبة' }, { status: 400 });
    }

    const companyId = session.companyId!;
    const existing = await prisma.contract.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { branchId: true, attachments: true },
    });
    if (!existing) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });

    // تحويل buildingId إلى branchId
    let branchId = existing.branchId;
    if (buildingId !== undefined) {
      if (buildingId === null || buildingId === '') {
        branchId = null;
      } else {
        const building = await prisma.building.findUnique({
          where: { id: buildingId },
          select: { branchId: true },
        });
        if (!building) return NextResponse.json({ error: 'المبنى المختار غير موجود' }, { status: 400 });
        branchId = building.branchId;
      }
    }

    // التحقق من صلاحية الفرع
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin && branchId) {
      const userBranchIds = session.branchIds || [];
      if (!userBranchIds.includes(branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية تعديل عقد لهذا الفرع' }, { status: 403 });
      }
    }

    // معالجة المرفقات (نفس الكود السابق)
    if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
      const currentAttachments = existing.attachments as { id: string; key: string }[];
      const toKeepIds = attachmentIds.filter((id: string) =>
        currentAttachments.some((a: { id: string }) => a.id === id)
      );
      const toRemove = currentAttachments.filter((a: { id: string }) => !attachmentIds.includes(a.id));
      for (const att of toRemove) {
        await deleteFileFromR2(att.key);
        await prisma.contractAttachment.delete({ where: { id: att.id } });
      }
      const newAttachmentIds = attachmentIds.filter((id: string) => !toKeepIds.includes(id));
      if (newAttachmentIds.length > 0) {
        await prisma.contractAttachment.updateMany({
          where: { id: { in: newAttachmentIds } },
          data: { contractId: id },
        });
      }
    } else if (attachmentIds !== undefined && attachmentIds.length === 0) {
      const currentAttachments = existing.attachments as { id: string; key: string }[];
      for (const att of currentAttachments) {
        await deleteFileFromR2(att.key);
        await prisma.contractAttachment.delete({ where: { id: att.id } });
      }
    }

    // تحديث بيانات العقد (بما فيها حقول المندوب)
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
      include: { attachments: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/contracts/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث العقد' }, { status: 500 });
  }
}

// DELETE: حذف ناعم للعقد مع حذف المرفقات من R2
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await checkPermission('contracts.delete');

    const { id } = await params;
    const companyId = session.companyId!;

    const existing = await prisma.contract.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { attachments: true },
    });
    if (!existing) return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });

    // التحقق من صلاحية الفرع
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin && existing.branchId) {
      const userBranchIds = session.branchIds || [];
      if (!userBranchIds.includes(existing.branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية حذف هذا العقد' }, { status: 403 });
      }
    }

    // حذف المرفقات من R2 ثم من قاعدة البيانات
    for (const att of existing.attachments) {
      await deleteFileFromR2(att.key);
      await prisma.contractAttachment.delete({ where: { id: att.id } });
    }

    // حذف ناعم للعقد
    await prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/contracts/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في حذف العقد' }, { status: 500 });
  }
}