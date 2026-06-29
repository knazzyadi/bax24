// src/lib/selects/asset/dashboard.select.ts
import { Prisma } from '@prisma/client';

/**
 * Select مخصص للوحة التحكم (إحصائيات سريعة)
 * يتم جلب أقل قدر من البيانات
 */
export const assetDashboardSelect = {
  id: true,
  name: true,
  code: true,
  status: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  type: {
    select: {
      id: true,
      name: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
  building: {
    select: {
      id: true,
      name: true,
    },
  },
  room: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  lastMaintenanceDate: true,
} satisfies Prisma.AssetSelect;

/**
 * Select للإحصائيات العددية فقط (أسرع استعلام)
 */
export const assetCountSelect = {
  _count: {
    select: {
      id: true,
    },
  },
} as const;