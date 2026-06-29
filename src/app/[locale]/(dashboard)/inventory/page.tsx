// src/app/[locale]/(dashboard)/inventory/page.tsx

import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/auth-helper';
import { InventoryRepository } from '@/lib/repositories/inventory.repository';
import InventoryClient from "./InventoryClient";
import type { InventoryItem } from "./types";

// =========================
// Page
// =========================
export default async function InventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const session = await getAuthSession().catch(() => null);
  if (!session) redirect("/login");

  const { locale } = await params;
  const {
    q = "",
    status = "all",
    page = "1",
  } = await searchParams;

  const companyId = session.companyId;
  const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
  const branchIds = session.branchIds || [];
  const limit = 10;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (currentPage - 1) * limit;

  // =========================
  // Build Where Clause
  // =========================
  const where: any = {
    companyId,
    deletedAt: null,
  };

  // فلتر الفروع
  if (!isAdmin) {
    if (branchIds.length > 0) {
      where.room = {
        floor: {
          building: {
            branchId: { in: branchIds },
          },
        },
      };
    } else {
      // لا فروع مسموحة → قائمة فارغة
      return (
        <InventoryClient
          initialItems={[]}
          initialSearch={q}
          initialStatus={status}
          locale={locale}
        />
      );
    }
  }

  if (q.trim()) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { nameEn: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
    ];
  }

  // =========================
  // Fetch Data with Prisma (directly to keep exact shape)
  // =========================
  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        room: {
          include: {
            floor: {
              include: {
                building: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  // =========================
  // Serialize dates
  // =========================
  const serializedItems: InventoryItem[] = items.map((item: any) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const totalPages = Math.ceil(total / limit);

  // =========================
  // Render (InventoryClient handles pagination internally)
  // =========================
  return (
    <InventoryClient
      initialItems={serializedItems}
      initialSearch={q}
      initialStatus={status}
      locale={locale}
    />
  );
}