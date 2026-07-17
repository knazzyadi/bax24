// src/app/[locale]/(dashboard)/locations/floors/page.tsx

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import FloorsClient from './FloorsClient';
import type { Floor, Building } from './types'; // ✅ استيراد من الملف المحلي

export default async function FloorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const session = await requireRole(['ADMIN', 'SUPER_ADMIN']);

  const companyId = session.user.companyId;
  if (!companyId) {
    throw new Error('Company ID is missing');
  }

  const floors = await prisma.floor.findMany({
    where: {
      building: {
        companyId: companyId,
        deletedAt: null,
      },
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          nameEn: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  const buildings = await prisma.building.findMany({
    where: {
      companyId: companyId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const transformedFloors: Floor[] = floors.map((floor) => ({
    id: floor.id,
    name: floor.name,
    nameEn: floor.nameEn,
    code: floor.code,
    order: floor.order,
    buildingId: floor.buildingId,
    building: {
      id: floor.building.id,
      name: floor.building.name,
    },
  }));

  const transformedBuildings: Building[] = buildings.map((b) => ({
    id: b.id,
    name: b.name,
  }));

  return (
    <FloorsClient
      initialFloors={transformedFloors}
      initialBuildings={transformedBuildings}
      locale={locale}
    />
  );
}