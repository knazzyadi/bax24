// src/app/[locale]/(dashboard)/maintenance/page.tsx

import { redirect } from "next/navigation";
import { getAuthSession, requirePermission } from '@/lib/auth/auth-helper';
import { prisma } from "@/lib/prisma";

import MaintenanceClient from "./MaintenanceClient";

interface ScheduleForClient {
  id: string;
  name: string;
  frequency: string;
  frequencyDays?: number;
  leadDays: number;
  isActive: boolean;
  startDate?: string | null;
  createdAt: string;
  lastRunAt?: string | null;

  assetType: {
    id: string;
    name: string;
    nameEn?: string;
  } | null;

  branch: {
    id: string;
    name: string;
    nameEn?: string;
  } | null;

  building: {
    id: string;
    name: string;
    nameEn?: string;
  } | null;
}

export default async function MaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;

  searchParams: Promise<{
    q?: string;
    isActive?: string;
    page?: string;
  }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  await requirePermission("maintenance.read");

  const { locale } = await params;

  const {
    q = "",
    isActive = "",
    page = "1",
  } = await searchParams;

  const companyId = session.companyId;
  const isAdmin = session.isAdmin;
  const branchIds = session.branchIds || [];

  const where: any = {
    companyId,
  };

  if (!isAdmin && branchIds.length) {
    where.branchId = {
      in: branchIds,
    };
  }

  if (q) {
    where.name = {
      contains: q,
      mode: "insensitive",
    };
  }

  if (isActive === "true") {
    where.isActive = true;
  }

  if (isActive === "false") {
    where.isActive = false;
  }

  const limit = 10;

  const currentPage = parseInt(page);

  const skip =
    (currentPage - 1) * limit;

  const [schedules, total] =
    await Promise.all([
      prisma.maintenanceSchedule.findMany({
        where,

        select: {
          id: true,
          name: true,
          frequency: true,
          frequencyDays: true,
          leadDays: true,
          isActive: true,
          startDate: true,
          createdAt: true,
          lastRunAt: true,

          assetType: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            },
          },

          branch: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            },
          },

          building: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,
      }),

      prisma.maintenanceSchedule.count({
        where,
      }),
    ]);

  type MaintenanceScheduleItem =
    (typeof schedules)[number];

  const transformedSchedules:
    ScheduleForClient[] =
    schedules.map(
      (s: MaintenanceScheduleItem) => ({
        id: s.id,

        name: s.name,

        frequency: s.frequency,

        frequencyDays:
          s.frequencyDays ?? undefined,

        leadDays: s.leadDays,

        isActive: s.isActive,

        startDate: s.startDate
          ? s.startDate.toISOString()
          : null,

        createdAt:
          s.createdAt.toISOString(),

        lastRunAt: s.lastRunAt
          ? s.lastRunAt.toISOString()
          : null,

        assetType: s.assetType
          ? {
              id: s.assetType.id,
              name: s.assetType.name,
              nameEn:
                s.assetType.nameEn ??
                undefined,
            }
          : null,

        branch: s.branch
          ? {
              id: s.branch.id,
              name: s.branch.name,
              nameEn:
                s.branch.nameEn ??
                undefined,
            }
          : null,

        building: s.building
          ? {
              id: s.building.id,
              name: s.building.name,
              nameEn:
                s.building.nameEn ??
                undefined,
            }
          : null,
      })
    );

  return (
    <MaintenanceClient
      initialSchedules={
        transformedSchedules
      }
      total={total}
      currentPage={currentPage}
      totalPages={Math.ceil(
        total / limit
      )}
      limit={limit}
      q={q}
      isActive={isActive}
      locale={locale}
    />
  );
}