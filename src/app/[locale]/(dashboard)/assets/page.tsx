// src/app/[locale]/(dashboard)/assets/page.tsx

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  AssetRepository,
  type AssetWithRelations,
} from '@/lib/repositories/asset.repository';
import AssetsClient from './AssetsClient';
import type { AssetType, AssetStatus } from '@/types/assets';
import { Prisma } from '@prisma/client';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';
import { mapAsset } from '@/lib/mappers/asset.mapper';

// --- مكون الصفحة الرئيسي ---

export default async function AssetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; typeId?: string; statusId?: string; page?: string; limit?: string }>;
}) {
  const paramsResolved = await params;
  const searchParamsResolved = await searchParams || {};

  // 1. التحقق من المصادقة والصلاحيات
  let session;
  try {
    session = await getAuthenticatedSession();
  } catch {
    redirect('/login');
  }

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/login');
  }

  const { locale } = paramsResolved;
  const { q, typeId, statusId, page = '1', limit = '10' } = searchParamsResolved;
  const companyId = session.companyId;

  if (!companyId) {
    redirect('/login');
  }

  // 2. إعداد التصفية والترقيم
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.AssetWhereInput = {
    companyId,
    deletedAt: null,
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { nameEn: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { room: { name: { contains: q, mode: 'insensitive' } } },
      { room: { nameEn: { contains: q, mode: 'insensitive' } } },
      { room: { floor: { name: { contains: q, mode: 'insensitive' } } } },
      { room: { floor: { nameEn: { contains: q, mode: 'insensitive' } } } },
      { room: { floor: { building: { name: { contains: q, mode: 'insensitive' } } } } },
      { room: { floor: { building: { nameEn: { contains: q, mode: 'insensitive' } } } } },
    ];
  }
  if (typeId && typeId !== 'all') where.typeId = typeId;
  if (statusId && statusId !== 'all') where.statusId = statusId;

  // 3. جلب البيانات من المستودع
  const totalCount = await AssetRepository.count(where);

  const result = await AssetRepository.findMany({
    where,
    limit: limitNum,
    skip,
    orderBy: { createdAt: 'desc' },
  });

  const assetsRaw: AssetWithRelations[] = result.data;
  const startIndex = totalCount > 0 ? skip + 1 : 0;

  // 4. تحويل البيانات الخام باستخدام mapper
  const transformedAssets = assetsRaw.map(mapAsset);

  // 5. جلب أنواع وحالات الأصول (بدون علاقات)
  const [assetTypesRaw, assetStatusesRaw] = await Promise.all([
    prisma.assetType.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
    }),
    prisma.assetStatus.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
    }),
  ]);

  const assetTypes: AssetType[] = assetTypesRaw.map((type) => ({
    ...type,
    nameEn: type.nameEn ?? undefined,
    code: type.code ?? undefined,
    description: type.description ?? undefined,
    deletedAt: type.deletedAt?.toISOString() ?? null,
    createdAt: type.createdAt.toISOString(),
    updatedAt: type.updatedAt.toISOString(),
  }));

  const assetStatuses: AssetStatus[] = assetStatusesRaw.map((status) => ({
    ...status,
    nameEn: status.nameEn ?? undefined,
    code: status.code ?? undefined,
    color: status.color ?? undefined,
    deletedAt: status.deletedAt?.toISOString() ?? null,
    createdAt: status.createdAt.toISOString(),
    updatedAt: status.updatedAt.toISOString(),
    description: status.description ?? undefined,
  }));

  // 6. بناء روابط التنقل
  const baseUrl = `/${locale}/assets`;
  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (typeId && typeId !== 'all') queryParams.set('typeId', typeId);
  if (statusId && statusId !== 'all') queryParams.set('statusId', statusId);
  if (limit) queryParams.set('limit', limit);

  const totalPages = Math.ceil(totalCount / limitNum);
  const nextUrl =
    pageNum < totalPages
      ? `${baseUrl}?${queryParams.toString()}&page=${pageNum + 1}`
      : null;
  const prevUrl =
    pageNum > 1
      ? `${baseUrl}?${queryParams.toString()}&page=${pageNum - 1}`
      : null;

  // 7. عرض المكون العميل مع البيانات
  return (
    <AssetsClient
      initialAssets={transformedAssets}
      assetTypes={assetTypes}
      assetStatuses={assetStatuses}
      q={q || ''}
      typeId={typeId || ''}
      statusId={statusId || ''}
      locale={locale}
      pagination={{
        hasMore: pageNum < totalPages,
        nextUrl,
        prevUrl,
        currentCount: assetsRaw.length,
        totalCount,
        startIndex,
        currentPage: pageNum,
        totalPages,
      }}
    />
  );
}