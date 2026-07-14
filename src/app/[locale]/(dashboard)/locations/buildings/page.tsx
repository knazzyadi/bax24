// src/app/[locale]/(dashboard)/locations/buildings/page.tsx

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import BuildingsClient from './BuildingsClient';

interface Building {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
  branchId: string | null;
  branchName: string | null;
}

interface Branch {
  id: string;
  name: string;
}

export default async function BuildingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // ✅ التحقق من الصلاحية في الخادم
  const session = await requireRole(['ADMIN', 'SUPER_ADMIN']);

  const companyId = session.user.companyId;
  if (!companyId) {
    throw new Error('Company ID is missing');
  }

  // ✅ جلب المباني من قاعدة البيانات
  const buildings = await prisma.building.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  // ✅ جلب الفروع
  const branches = await prisma.branch.findMany({
    where: {
      companyId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // ✅ تحويل البيانات
  const transformedBuildings: Building[] = buildings.map((building) => ({
    id: building.id,
    name: building.name,
    nameEn: building.nameEn,
    code: building.code,
    order: building.order,
    branchId: building.branchId,
    branchName: building.branch?.name || null,
  }));

  const transformedBranches: Branch[] = branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
  }));

  return (
    <BuildingsClient
      initialBuildings={transformedBuildings}
      initialBranches={transformedBranches}
      locale={locale}
    />
  );
}