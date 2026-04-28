import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const branchIds = session.user.branchIds;

    // شرط أساسي: نفس الشركة وغير محذوف
    const baseWhere: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    let buildingIdsFilter: string[] | null = null;
    if (!isAdmin && branchIds && branchIds.length > 0) {
      buildingIdsFilter = branchIds;
    } else if (!isAdmin && (!branchIds || branchIds.length === 0)) {
      return NextResponse.json(0);
    }

    // عناصر المخزون (InventoryItem) مرتبطة بغرفة، والغرفة مرتبطة بمبنى (عبر buildingId)
    const whereInventory: any = {
      ...baseWhere,
      quantity: { lt: prisma.inventoryItem.fields.minQuantity },
    };

    if (buildingIdsFilter) {
      whereInventory.room = {
        buildingId: { in: buildingIdsFilter },
      };
    }

    const count = await prisma.inventoryItem.count({ where: whereInventory });
    return NextResponse.json(count);
  } catch (error) {
    console.error('GET /api/stats/low-inventory-count error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}