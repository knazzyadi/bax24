// src/app/[locale]/(dashboard)/assets/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AssetRepository } from '@/lib/repositories/asset.repository';
import AssetsClient from './AssetsClient';
import type { Asset, AssetType, AssetStatus } from '@/types/assets';
import { Prisma } from '@prisma/client';
import { getAuthenticatedSession } from '@/lib/auth/auth-helper';

export default async function AssetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; typeId?: string; statusId?: string; page?: string; limit?: string }>;
}) {
  const paramsResolved = await params;
  const searchParamsResolved = await searchParams || {};

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

  const totalCount = await AssetRepository.count(where);

  const result = await AssetRepository.findMany({
    where,
    limit: limitNum,
    skip,
    orderBy: { createdAt: 'desc' },
  });

  const { data: assetsRaw } = result;

  const startIndex = totalCount > 0 ? skip + 1 : 0;

  // ✅ استخدام ...asset للحفاظ على جميع الحقول بما فيها companyId
  const transformedAssets: Asset[] = assetsRaw.map((asset: any) => ({
    ...asset,
    nameEn: asset.nameEn ?? undefined,
    description: asset.description ?? undefined,
    descriptionEn: asset.descriptionEn ?? undefined,
    purchaseDate: asset.purchaseDate?.toISOString() ?? null,
    warrantyEnd: asset.warrantyEnd?.toISOString() ?? null,
    lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString() ?? null,
    notes: asset.notes ?? undefined,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    // ✅ type و status مع companyId
    type: asset.type ? {
      ...asset.type,
      nameEn: asset.type.nameEn ?? undefined,
      description: asset.type.description ?? undefined,
    } : undefined,
    status: asset.status ? {
      ...asset.status,
      nameEn: asset.status.nameEn ?? undefined,
      color: asset.status.color ?? undefined,
    } : undefined,
    room: asset.room ? {
      ...asset.room,
      nameEn: asset.room.nameEn ?? undefined,
      floor: asset.room.floor ? {
        ...asset.room.floor,
        nameEn: asset.room.floor.nameEn ?? undefined,
        building: asset.room.floor.building ? {
          ...asset.room.floor.building,
          nameEn: asset.room.floor.building.nameEn ?? undefined,
        } : undefined,
      } : undefined,
    } : undefined,
  }));

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

  // ✅ استخدام ...type للحفاظ على companyId
  const assetTypes: AssetType[] = assetTypesRaw.map((type: any) => ({
    ...type,
    nameEn: type.nameEn ?? undefined,
    description: type.description ?? undefined,
  }));

  // ✅ استخدام ...status للحفاظ على companyId
  const assetStatuses: AssetStatus[] = assetStatusesRaw.map((status: any) => ({
    ...status,
    nameEn: status.nameEn ?? undefined,
    color: status.color ?? undefined,
  }));

  const baseUrl = `/${locale}/assets`;
  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (typeId && typeId !== 'all') queryParams.set('typeId', typeId);
  if (statusId && statusId !== 'all') queryParams.set('statusId', statusId);
  if (limit) queryParams.set('limit', limit);

  const totalPages = Math.ceil(totalCount / limitNum);
  const nextUrl = pageNum < totalPages
    ? `${baseUrl}?${queryParams.toString()}&page=${pageNum + 1}`
    : null;
  const prevUrl = pageNum > 1
    ? `${baseUrl}?${queryParams.toString()}&page=${pageNum - 1}`
    : null;

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