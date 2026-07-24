import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, type AuthSession } from '@/lib/auth/auth-helper';
import { prisma } from '@/lib/prisma';
import {
  createAsset,
  getErrorResponse,
  getErrorResponseStatus,
} from '@/lib/assets';

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'code',
  'status',
  'purchaseDate',
] as const;

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function toAssetsSession(session: AuthSession): any {
  return {
    ...session,
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    companyId: session.companyId ?? null,
    companyName: session.companyName ?? null,
    companyNameEn: session.companyNameEn ?? null,
    branchId: session.branchId ?? null,
    branchIds: session.branchIds ?? [],
    isAdmin: session.isAdmin,
    isSuperAdmin: session.isSuperAdmin,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(Number(searchParams.get('page')) || 1, 1);
    const requestedLimit = Number(searchParams.get('limit')) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    const requestedSort = searchParams.get('sortBy') || 'createdAt';
    const sortBy = ALLOWED_SORT_FIELDS.includes(requestedSort as any)
      ? (requestedSort as typeof ALLOWED_SORT_FIELDS[number])
      : 'createdAt';

    const sortOrderParam = searchParams.get('sortOrder');
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';

    // قراءة المعاملات
    const branchId = searchParams.get('branchId') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const floorId = searchParams.get('floorId') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const status = searchParams.get('status') || undefined;
    const typeId = searchParams.get('typeId') || undefined;
    const search = searchParams.get('q') || undefined;

    // بناء شرط where
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.statusId = status;
    if (typeId) where.typeId = typeId;
    if (branchId) where.branchId = branchId;

    // معالجة الموقع: إذا كان roomId موجوداً استخدمه، وإلا إذا كان floorId موجوداً جلب كل الغرف في ذلك الدور، وإذا كان buildingId موجوداً جلب كل الغرف في كل أدوار المبنى.
    let roomIds: string[] | undefined;
    if (roomId) {
      roomIds = [roomId];
    } else if (floorId) {
      const rooms = await prisma.room.findMany({
        where: { floorId },
        select: { id: true },
      });
      roomIds = rooms.map(r => r.id);
      if (roomIds.length === 0) {
        return NextResponse.json({
          assets: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
    } else if (buildingId) {
      const floors = await prisma.floor.findMany({
        where: { buildingId },
        select: { id: true },
      });
      const floorIds = floors.map(f => f.id);
      if (floorIds.length === 0) {
        return NextResponse.json({
          assets: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
      const rooms = await prisma.room.findMany({
        where: { floorId: { in: floorIds } },
        select: { id: true },
      });
      roomIds = rooms.map(r => r.id);
      if (roomIds.length === 0) {
        return NextResponse.json({
          assets: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
    }

    if (roomIds && roomIds.length > 0) {
      where.roomId = { in: roomIds };
    }

    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          type: true,
          status: true,
          branch: true,
          room: {
            include: {
              floor: {
                include: {
                  building: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({
      assets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const response = getErrorResponseStatus(error);
    return NextResponse.json(response.body, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'بيانات الطلب غير صالحة (JSON غير صحيح)' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'بيانات الطلب غير صحيحة' }, { status: 400 });
    }

    const asset = await createAsset(toAssetsSession(session), body);

    return NextResponse.json(asset, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    const response = getErrorResponseStatus(error);
    return NextResponse.json(response.body, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  }
}