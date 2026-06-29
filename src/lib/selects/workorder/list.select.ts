// src/lib/selects/workorder/list.select.ts
import { Prisma } from '@prisma/client';

/**
 * Select لقائمة أوامر العمل (صفحة العرض الرئيسية)
 */
export const workOrderListSelect = {
  id: true,
  code: true,
  title: true,
  description: true,
  type: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  branchSeqNum: true,

  // العلاقات الأساسية
  priority: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      color: true,
    },
  },
  status: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      color: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  room: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      code: true,
      floor: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          building: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            },
          },
        },
      },
    },
  },
  assetType: {
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  },
  // عدد الأصول المرتبطة (تظهر كـ _count)
  _count: {
    select: {
      workOrderAssets: true,
      attachments: true,
    },
  },
} satisfies Prisma.WorkOrderSelect;