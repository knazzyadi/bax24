import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

// GET /api/inventory/[id] - جلب صنف واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('assets.read', session);

    const { id } = await params;

    const item = await prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: {
                  include: { branch: true },
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 });
    }

    // تحويل التواريخ
    const serialized = {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error('GET /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في جلب الصنف' }, { status: 500 });
  }
}

// PUT /api/inventory/[id] - تحديث صنف
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('assets.update', session); // افتراض وجود صلاحية

    const { id } = await params;
    const body = await request.json();
    const { name, nameEn, sku, quantity, minQuantity, unit, roomId, notes } = body;

    if (!name || !roomId) {
      return NextResponse.json({ error: 'الاسم والغرفة إلزاميان' }, { status: 400 });
    }

    // التحقق من وجود الصنف
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 });
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        nameEn: nameEn || null,
        sku: sku || null,
        quantity: quantity ?? 0,
        minQuantity: minQuantity ?? 0,
        unit: unit || null,
        notes: notes || null,
        room: {
          connect: { id: roomId },
        },
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('PUT /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الصنف' }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] - حذف ناعم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    await requirePermission('assets.delete', session);

    const { id } = await params;

    const existing = await prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 });
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'خطأ في حذف الصنف' }, { status: 500 });
  }
}