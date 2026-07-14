// src/app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import {
  getAsset,
  updateAsset,
  deleteAsset,
  getErrorResponseStatus,
} from '@/lib/assets';

// ============================================================
// GET - تفاصيل أصل واحد
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
    const asset = await getAsset(session, id);
    return NextResponse.json(asset);
  } catch (error) {
    const response = getErrorResponseStatus(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

// ============================================================
// PUT - تحديث أصل
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
    const body = await request.json();
    const asset = await updateAsset(session, id, body);
    return NextResponse.json(asset);
  } catch (error) {
    const response = getErrorResponseStatus(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

// ============================================================
// DELETE - حذف أصل
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
    const searchParams = request.nextUrl.searchParams;
    const hard = searchParams.get('hard') === 'true';

    const result = await deleteAsset(session, id, { hard });
    return NextResponse.json(result);
  } catch (error) {
    const response = getErrorResponseStatus(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}