// src/app/[locale]/(dashboard)/assets/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { getAssets } from '@/lib/data-fetching';
import AssetsClient from './AssetsClient';
import type { Asset, AssetType, AssetStatus } from '@/types/assets';

export default async function AssetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; typeId?: string; statusId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  await requirePermission('assets.read', session);

  const { locale } = await params;
  const { q, typeId, statusId } = await searchParams;
  const companyId = session.user.companyId!;

  // بناء شرط where للبحث والفلترة (سيُمرر إلى getAssets)
  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { nameEn: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (typeId && typeId !== 'all') where.typeId = typeId;
  if (statusId && statusId !== 'all') where.statusId = statusId;

  // جلب الأصول (مع تطبيق فلترة الفروع تلقائياً داخل getAssets)
  const assetsRaw = await getAssets(where);

  // تحويل البيانات إلى الشكل المطلوب من قبل AssetsClient
  const transformedAssets: Asset[] = assetsRaw.map((asset: any) => ({
    id: asset.id,
    name: asset.name,
    nameEn: asset.nameEn ?? undefined,
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
    notes: asset.notes ?? undefined,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  }));

  // جلب أنواع الأصول وحالاتها (للفلاتر)
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

  return (
    <AssetsClient
      initialAssets={transformedAssets}
      assetTypes={assetTypes}
      assetStatuses={assetStatuses}
      q={q || ''}
      typeId={typeId || ''}
      statusId={statusId || ''}
      locale={locale}
    />
  );
}