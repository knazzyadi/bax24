// src/lib/assets/permissions.ts

import { prisma } from '@/lib/prisma';
import { AssetNotFoundError, AssetBusinessError, AssetPermissionError } from './errors';

export interface AuthSession {
  userId: string;
  email?: string;
  companyId: string;
  role: string;
  branchIds?: string[];
}

// ============================================================
// صلاحيات الإنشاء
// ============================================================

export function ensureCanCreateAsset(session: AuthSession) {
  if (!['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(session.role)) {
    throw new AssetPermissionError('لا تملك صلاحية إنشاء أصول');
  }
}

export function ensureCanEditAsset(session: AuthSession) {
  if (!['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(session.role)) {
    throw new AssetPermissionError('لا تملك صلاحية تعديل الأصول');
  }
}

export function ensureCanDeleteAsset(session: AuthSession) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
    throw new AssetPermissionError('لا تملك صلاحية حذف الأصول');
  }
}

export function ensureCanViewAsset(session: AuthSession) {
  if (!['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'USER'].includes(session.role)) {
    throw new AssetPermissionError('لا تملك صلاحية عرض الأصول');
  }
}

// ============================================================
// صلاحيات الوصول للأصل
// ============================================================

export async function ensureAssetAccess(
  session: AuthSession,
  assetId: string
) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
    select: { companyId: true, branchId: true },
  });

  if (!asset) {
    throw new AssetNotFoundError('الأصل غير موجود');
  }

  if (asset.companyId !== session.companyId) {
    throw new AssetPermissionError('لا تملك صلاحية الوصول إلى هذا الأصل');
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
    const userBranchIds = session.branchIds || [];
    if (asset.branchId && !userBranchIds.includes(asset.branchId)) {
      throw new AssetPermissionError('لا تملك صلاحية الوصول إلى هذا الأصل');
    }
  }
}

// ============================================================
// صلاحيات الفرع
// ============================================================

export function ensureBranchAccess(session: AuthSession, branchId: string) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
    const userBranchIds = session.branchIds || [];
    if (!userBranchIds.includes(branchId)) {
      throw new AssetPermissionError('لا تملك صلاحية الوصول إلى هذا الفرع');
    }
  }
}

export function ensureCompanyAccess(session: AuthSession, companyId: string) {
  if (session.companyId !== companyId) {
    throw new AssetPermissionError('الشركة غير متطابقة');
  }
}

// ============================================================
// الحصول على المعرفات المسموحة
// ============================================================

export function getAllowedBranchIds(session: AuthSession): string[] | null {
  if (['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
    return null; // null يعني الكل
  }
  return session.branchIds || [];
}

export function getAllowedCompanyId(session: AuthSession): string | null {
  return session.companyId;
}

export async function filterAllowedAssetIds(
  session: AuthSession,
  assetIds: string[]
): Promise<string[]> {
  const allowedBranchIds = getAllowedBranchIds(session);
  const companyId = session.companyId;

  const assets = await prisma.asset.findMany({
    where: {
      id: { in: assetIds },
      companyId,
      deletedAt: null,
      ...(allowedBranchIds ? { branchId: { in: allowedBranchIds } } : {}),
    },
    select: { id: true },
  });

  return assets.map((a) => a.id);
}

export function ensureHasAnyBranchAccess(session: AuthSession) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
    const userBranchIds = session.branchIds || [];
    if (userBranchIds.length === 0) {
      throw new AssetPermissionError('لا تملك صلاحية الوصول إلى أي فرع');
    }
  }
}