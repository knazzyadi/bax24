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

  // ✅ الحصول على الجلسة مع معالجة الأخطاء
  let session;
  try {
    session = await getAuthenticatedSession();
  } catch {
    redirect('/login');
  }

  if (!session) {
    redirect('/login');
  }

  // ✅ التحقق من الصلاحية
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

  // بناء شرط where
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

  // ✅ جلب العدد الإجمالي (بعد تطبيق الفلاتر)
  const totalCount = await AssetRepository.count(where);

  // ✅ جلب الأصول مع الترقيم المبني على الصفحة
  const result = await AssetRepository.findMany({
    where,
    limit: limitNum,
    skip, // ✅ استخدام skip بدلاً من cursor
    orderBy: { createdAt: 'desc' },
  });

  const { data: assetsRaw } = result;

  // ✅ حساب startIndex الفعلي
  const startIndex = totalCount > 0 ? skip + 1 : 0;

  // تحويل البيانات
  const transformedAssets: Asset[] = assetsRaw.map((asset: any) => ({
    id: asset.id,
    name: asset.name,
    nameEn: asset.nameEn ?? undefined,
    description: asset.description ?? undefined,
    descriptionEn: asset.descriptionEn ?? undefined,
    code: asset.code,
    type: asset.type
      ? {
          id: asset.type.id,
          name: asset.type.name,
          nameEn: asset.type.nameEn ?? undefined,
          description: asset.type.description ?? undefined,
          order: asset.type.order,
          isDefault: asset.type.isDefault,
        }
      : undefined,
    status: asset.status
      ? {
          id: asset.status.id,
          name: asset.status.name,
          nameEn: asset.status.nameEn ?? undefined,
          color: asset.status.color ?? undefined,
        }
      : undefined,
    room: asset.room
      ? {
          id: asset.room.id,
          name: asset.room.name,
          nameEn: asset.room.nameEn ?? undefined,
          floorId: asset.room.floorId,
          floor: asset.room.floor
            ? {
                id: asset.room.floor.id,
                name: asset.room.floor.name,
                nameEn: asset.room.floor.nameEn ?? undefined,
                buildingId: asset.room.floor.buildingId,
                building: asset.room.floor.building
                  ? {
                      id: asset.room.floor.building.id,
                      name: asset.room.floor.building.name,
                      nameEn: asset.room.floor.building.nameEn ?? undefined,
                    }
                  : undefined,
              }
            : undefined,
        }
      : undefined,
    purchaseDate: asset.purchaseDate?.toISOString() ?? null,
    warrantyEnd: asset.warrantyEnd?.toISOString() ?? null,
    lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString() ?? null,
    notes: asset.notes ?? undefined,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  }));

  // جلب أنواع الأصول وحالاتها
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

  const assetTypes: AssetType[] = assetTypesRaw.map((type: any) => ({
    id: type.id,
    name: type.name,
    nameEn: type.nameEn ?? undefined,
    description: type.description ?? undefined,
    order: type.order,
    isDefault: type.isDefault,
  }));

  const assetStatuses: AssetStatus[] = assetStatusesRaw.map((status: any) => ({
    id: status.id,
    name: status.name,
    nameEn: status.nameEn ?? undefined,
    color: status.color ?? undefined,
  }));

  // ✅ بناء روابط التنقل مع الحفاظ على معاملات البحث
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