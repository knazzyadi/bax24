// src/app/api/stats/low-inventory-count/route.ts

import { NextResponse } from 'next/server';

import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'لا توجد شركة مرتبطة' },
        { status: 400 }
      );
    }

    const isAdmin =
      session.role === 'ADMIN' ||
      session.role === 'SUPER_ADMIN';

    const branchIds = session.branchIds || [];

    const baseWhere: Prisma.InventoryItemWhereInput = {
      companyId,
      deletedAt: null,
    };

    if (!isAdmin) {
      if (branchIds.length === 0) {
        return NextResponse.json({ count: 0 });
      }

      baseWhere.room = {
        floor: {
          building: {
            branchId: {
              in: branchIds,
            },
          },
        },
      };
    }

    const items = await prisma.inventoryItem.findMany({
      where: baseWhere,
      select: {
        quantity: true,
        minQuantity: true,
      },
    });

    const lowItemsCount = items.filter(
      (item) => item.quantity < item.minQuantity
    ).length;

    return NextResponse.json({
      count: lowItemsCount,
    });
  } catch (error: unknown) {
    console.error(
      'GET /api/stats/low-inventory-count error:',
      error
    );

    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}