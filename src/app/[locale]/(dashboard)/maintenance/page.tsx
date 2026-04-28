import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import MaintenanceClient from "./MaintenanceClient";

// تعريف النوع المبسط للـ Schedule الذي سيمرر إلى العميل
interface ScheduleForClient {
  id: string;
  name: string;
  frequency: string;
  leadDays: number;
  isActive: boolean;
  lastRunAt: string | null;
  assetType: { id: string; name: string; nameEn?: string } | null;
  branch: { id: string; name: string; nameEn?: string } | null;
  building: { id: string; name: string; nameEn?: string } | null;
}

export default async function MaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; isActive?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  await requirePermission("maintenance.read", session);

  const { locale } = await params;
  const { q = "", isActive = "", page = "1" } = await searchParams;
  const companyId = session.user.companyId!;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  const branchIds = session.user.branchIds || [];

  const where: any = { companyId };
  if (!isAdmin && branchIds.length) where.branchId = { in: branchIds };
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (isActive === "true") where.isActive = true;
  if (isActive === "false") where.isActive = false;

  const limit = 10;
  const skip = (parseInt(page) - 1) * limit;

  const [schedules, total] = await Promise.all([
    prisma.maintenanceSchedule.findMany({
      where,
      include: { assetType: true, branch: true, building: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.maintenanceSchedule.count({ where }),
  ]);

  // تحويل البيانات مع تحديد النوع بوضوح
  const transformedSchedules: ScheduleForClient[] = schedules.map((s: any) => ({
    id: s.id,
    name: s.name,
    frequency: s.frequency,
    leadDays: s.leadDays,
    isActive: s.isActive,
    lastRunAt: s.lastRunAt ? s.lastRunAt.toISOString() : null,
    assetType: s.assetType
      ? {
          id: s.assetType.id,
          name: s.assetType.name,
          nameEn: s.assetType.nameEn ?? undefined,
        }
      : null,
    branch: s.branch
      ? {
          id: s.branch.id,
          name: s.branch.name,
          nameEn: s.branch.nameEn ?? undefined,
        }
      : null,
    building: s.building
      ? {
          id: s.building.id,
          name: s.building.name,
          nameEn: s.building.nameEn ?? undefined,
        }
      : null,
  }));

  return (
    <MaintenanceClient
      initialSchedules={transformedSchedules}
      total={total}
      currentPage={parseInt(page)}
      totalPages={Math.ceil(total / limit)}
      limit={limit}
      q={q}
      isActive={isActive}
      locale={locale}
    />
  );
}