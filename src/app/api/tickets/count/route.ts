// src/app/api/tickets/count/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Prisma, TicketStatus } from '@prisma/client';

import {
  getAuthenticatedSession,
  requirePermission,
} from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';

// قيم TicketStatus المسموحة
const validStatuses: TicketStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
];

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json({ count: 0 });
    }

    let hasPermission = true;

    try {
      await requirePermission('tickets.read');
    } catch {
      hasPermission = false;
    }

    if (!hasPermission) {
      return NextResponse.json({ count: 0 });
    }

    const { searchParams } = new URL(request.url);

    const statusParam = searchParams.get('status') ?? 'PENDING';

    if (!validStatuses.includes(statusParam as TicketStatus)) {
      return NextResponse.json(
        { error: 'قيمة حالة غير صالحة' },
        { status: 400 }
      );
    }

    const status = statusParam as TicketStatus;

    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    const isAdmin = session.role === 'ADMIN' || isSuperAdmin;

    const userBranchIds = session.branchIds ?? [];

    const where: Prisma.TicketWhereInput = {
      status,
      deletedAt: null,
    };

    if (!isSuperAdmin) {
      if (!session.companyId) {
        return NextResponse.json({ count: 0 });
      }

      where.companyId = session.companyId;

      if (!isAdmin) {
        if (userBranchIds.length === 0) {
          return NextResponse.json({ count: 0 });
        }

        where.branchId = {
          in: userBranchIds,
        };
      }
    }

    const count = await prisma.ticket.count({ where });

    return NextResponse.json({ count });
  } catch (error: unknown) {
    console.error('Error fetching tickets count:', error);

    return NextResponse.json({ count: 0 });
  }
}