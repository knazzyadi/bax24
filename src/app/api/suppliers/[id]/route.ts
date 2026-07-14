// src/app/api/suppliers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// ============================================================
// GET - جلب مورد واحد
// ============================================================
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

    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        contactPerson: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error in GET /api/suppliers/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المورد' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - تحديث مورد
// ============================================================
export async function PUT(
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
    const body = await request.json();
    const { name, nameEn, code, contactPerson, phone, email, isActive } = body;

    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existingSupplier) {
      return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 });
    }

    if (name?.trim()) {
      const duplicate = await prisma.supplier.findFirst({
        where: {
          companyId,
          name: name.trim(),
          deletedAt: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'هناك مورد بنفس الاسم بالفعل' }, { status: 409 });
      }
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: name?.trim() || existingSupplier.name,
        nameEn: nameEn?.trim() || null,
        code: code?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        isActive: isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        contactPerson: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/suppliers/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث المورد' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - حذف مورد (ناعم)
// ============================================================
export async function DELETE(
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

    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 });
    }

    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'تم حذف المورد بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/suppliers/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف المورد' },
      { status: 500 }
    );
  }
}