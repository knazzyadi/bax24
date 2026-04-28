// src/app/api/contracts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

// GET: جلب عقد واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('contracts.read', session);

    const { id } = await params;
    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'لا توجد شركة مرتبطة' }, { status: 400 });
    }

    const contract = await prisma.contract.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { branch: true }, // ✅ إضافة هذا السطر
    });

    if (!contract) {
      return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });
    }

    // التحقق من صلاحية الفرع للمستخدمين غير الأدمن
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const userBranchIds = session.user.branchIds || [];
      const contractBranchId = contract.branchId;
      if (!contractBranchId || !userBranchIds.includes(contractBranchId)) {
        return NextResponse.json({ error: 'غير مصرح بالوصول إلى هذا العقد' }, { status: 403 });
      }
    }

    // تحويل التواريخ
    const serialized = {
      ...contract,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate.toISOString().split('T')[0],
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error('GET /api/contracts/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في جلب العقد' }, { status: 500 });
  }
}

// PUT: تحديث عقد (يستقبل buildingId ويحوله إلى branchId)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('contracts.update', session);

    const { id } = await params;
    const body = await request.json();
    const { title, supplier, value, startDate, endDate, description, notes, buildingId } = body;

    if (!title || !supplier || !startDate || !endDate) {
      return NextResponse.json({ error: 'العنوان، المورد، وتاريخي البداية والنهاية مطلوبة' }, { status: 400 });
    }

    const companyId = session.user.companyId!;
    const existing = await prisma.contract.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { branchId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });
    }

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
        if (!building) {
          return NextResponse.json({ error: 'المبنى المختار غير موجود' }, { status: 400 });
        }
        branchId = building.branchId;
      }
    }

    // التحقق من صلاحية الفرع للمستخدمين غير الأدمن
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin && branchId) {
      const userBranchIds = session.user.branchIds || [];
      if (!userBranchIds.includes(branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية تعديل عقد لهذا الفرع' }, { status: 403 });
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
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/contracts/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث العقد' }, { status: 500 });
  }
}

// DELETE: حذف ناعم للعقد
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('contracts.delete', session);

    const { id } = await params;
    const companyId = session.user.companyId!;

    const existing = await prisma.contract.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true, branchId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'العقد غير موجود' }, { status: 404 });
    }

    // التحقق من صلاحية الفرع لغير الأدمن
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin && existing.branchId) {
      const userBranchIds = session.user.branchIds || [];
      if (!userBranchIds.includes(existing.branchId)) {
        return NextResponse.json({ error: 'لا تملك صلاحية حذف هذا العقد' }, { status: 403 });
      }
    }

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