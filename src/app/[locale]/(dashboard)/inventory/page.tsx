// src/app/[locale]/(dashboard)/inventory/page.tsx

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/auth-helper";
import InventoryClient from "./InventoryClient";
import type { InventoryItem } from "./types";
import type { Prisma } from "@prisma/client";

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

  const { q = "", status = "all", page = "1" } = await searchParams;

  const companyId = session.companyId;
  if (!companyId) {
    redirect("/login");
  }
  const isAdmin =
    session.role === "ADMIN" || session.role === "SUPER_ADMIN";

  const branchIds = session.branchIds || [];

  const limit = 10;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (currentPage - 1) * limit;

  // =========================
  // Build Where Clause
  // =========================
  const where: Prisma.InventoryItemWhereInput = {
    companyId,
    deletedAt: null,
  };

  // فلتر الفروع
  if (!isAdmin) {
    if (branchIds.length > 0) {
      where.room = {
        floor: {
          building: {
            branchId: {
              in: branchIds,
            },
          },
        },
      };
    } else {
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
      {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        nameEn: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        sku: {
          contains: q,
          mode: "insensitive",
        },
      },
    ];
  }

  // =========================
  // Fetch Data (بدون count لأنه غير مستخدم)
  // =========================
  const items = await prisma.inventoryItem.findMany({
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
    orderBy: {
      name: "asc",
    },
    skip,
    take: limit,
  });

  // =========================
  // Serialize dates
  // =========================
  const serializedItems: InventoryItem[] = items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <InventoryClient
      initialItems={serializedItems}
      initialSearch={q}
      initialStatus={status}
      locale={locale}
    />
  );
}