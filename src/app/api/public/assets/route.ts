// src/app/api/public/assets/route.ts

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const slug = searchParams.get('slug');
    const token = searchParams.get('token');
    const roomId = searchParams.get('roomId');
    const typeId = searchParams.get('typeId');

    if (!slug || !token || !roomId) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findFirst({
      where: {
        slug,
        publicToken: token,
      },
      select: {
        companyId: true,
        allowPublicTickets: true,
      },
    });

    if (!branch || !branch.allowPublicTickets) {
      return NextResponse.json(
        { error: 'Invalid branch or public tickets disabled' },
        { status: 403 }
      );
    }

    const whereClause: Prisma.AssetWhereInput = {
      roomId,
      companyId: branch.companyId,
      deletedAt: null,
    };

    if (typeId && typeId !== 'all' && typeId !== '') {
      whereClause.typeId = typeId;
    }

    const assets = await prisma.asset.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        nameEn: true,
        code: true,
        typeId: true,
        statusId: true,
        deletedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const filteredAssets = assets.filter(
      (asset) => asset.deletedAt === null
    );

    return NextResponse.json({
      assets: filteredAssets,
    });
  } catch (error: unknown) {
    console.error('Public assets API error:', error);

    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}