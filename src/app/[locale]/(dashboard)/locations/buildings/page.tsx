// src/app/[locale]/(dashboard)/buildings/page.tsx
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

  // ✅ التحقق من الصلاحية في الخادم (يسمح بـ ADMIN و SUPER_ADMIN)
  const session = await requireRole(['ADMIN', 'SUPER_ADMIN']);

  // ✅ التأكد من وجود companyId
  const companyId = session.user.companyId;
  if (!companyId) {
    throw new Error('Company ID is missing');
  }

  // ✅ جلب المباني من قاعدة البيانات مباشرة
  const buildings = await prisma.building.findMany({
    where: {
      companyId: companyId, // ✅ الآن هي string مؤكدة
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

  // ✅ جلب الفروع لعرضها في الفورم
  const branches = await prisma.branch.findMany({
    where: {
      companyId: companyId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // ✅ تحويل البيانات للشكل المطلوب
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