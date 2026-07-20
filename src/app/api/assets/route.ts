// src/app/api/assets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, type AuthSession } from '@/lib/auth/auth-helper';
import {
  listAssets,
  createAsset,
  getErrorResponse,
  getErrorResponseStatus,
  type ListAssetsOptions,
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

// ============================================================
// دالة مساعدة لتحويل الجلسة إلى النوع المطلوب من lib/assets
// ============================================================
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

// ============================================================
// GET - قائمة الأصول
// ============================================================

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

    const options: ListAssetsOptions = {
      page,
      limit,
      search: searchParams.get('q') || undefined,
      status: searchParams.get('status') || undefined,
      typeId: searchParams.get('typeId') || undefined,
      roomId: searchParams.get('roomId') || undefined,
      branchId: searchParams.get('branchId') || undefined,
      sortBy,
      sortOrder,
    };

    const result = await listAssets(toAssetsSession(session), options);

    return NextResponse.json(result, {
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

// ============================================================
// POST - إنشاء أصل جديد
// ============================================================

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