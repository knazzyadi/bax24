// src/app/[locale]/(dashboard)/locations/floors/page.tsx
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import FloorsClient from './FloorsClient';

interface Floor {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
  buildingId: string;
  building: {
    id: string;
    name: string;
  };
}

export default async function FloorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // ✅ التحقق من الصلاحية في الخادم (يسمح بـ ADMIN و SUPER_ADMIN)
  const session = await requireRole(['ADMIN', 'SUPER_ADMIN']);

  const companyId = session.user.companyId;
  if (!companyId) {
    throw new Error('Company ID is missing');
  }

  // ✅ جلب الأدوار مع المباني المرتبطة بها
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

  // ✅ جلب المباني لعرضها في الفورم
  const buildings = await prisma.building.findMany({
    where: {
      companyId: companyId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // ✅ تحويل البيانات للشكل المطلوب
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

  const transformedBuildings = buildings.map((b) => ({
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