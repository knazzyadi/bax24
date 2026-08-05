// src/app/api/assets/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, type AuthSession } from '@/lib/auth/auth-helper';
import {
  getAsset,
  updateAsset,
  deleteAsset,
  getErrorResponseStatus,
} from '@/lib/assets';
import { createAssetAudit } from '@/lib/audit/asset';
import { AuditAction } from '@/lib/audit/types';

// ============================================================
// النوع المطلوب في lib/assets
// ============================================================

type AssetsSession = AuthSession & {
  companyId: string | null;
  companyName: string | null;
  companyNameEn: string | null;
  branchId: string | null;
  branchIds: string[];
};

// ============================================================
// تحويل الجلسة
// ============================================================

function toAssetsSession(session: AuthSession): AssetsSession {
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

    const asset = await getAsset(toAssetsSession(session), id);

    return NextResponse.json(asset);
  } catch (error) {
    const response = getErrorResponseStatus(error);

    return NextResponse.json(response.body, {
      status: response.status,
    });
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

    const prepared = toAssetsSession(session);

    const oldAsset = await getAsset(prepared, id);

    const body = await request.json();

    const updatedAsset = await updateAsset(prepared, id, body);

    await createAssetAudit(
      AuditAction.UPDATE,
      id,
      session.userId,
      session.email,
      oldAsset,
      updatedAsset,
      {
        updatedFields: Object.keys(body),
      }
    );

    return NextResponse.json(updatedAsset);
  } catch (error) {
    const response = getErrorResponseStatus(error);

    return NextResponse.json(response.body, {
      status: response.status,
    });
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

    const prepared = toAssetsSession(session);

    const oldAsset = await getAsset(prepared, id);

    const result = await deleteAsset(prepared, id, { hard });

    await createAssetAudit(
      AuditAction.DELETE,
      id,
      session.userId,
      session.email,
      oldAsset,
      null,
      { hard }
    );

    return NextResponse.json(result);
  } catch (error) {
    const response = getErrorResponseStatus(error);

    return NextResponse.json(response.body, {
      status: response.status,
    });
  }
}