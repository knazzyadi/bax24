// src/lib/selects/inventory/list.select.ts
import { Prisma } from '@prisma/client';

/**
 * Select لقائمة المخزون (صفحة العرض الرئيسية)
 */
export const inventoryListSelect = {
  id: true,
  sku: true,
  name: true,
  nameEn: true,
  quantity: true,
  minQuantity: true,
  unit: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,

  // العلاقات
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
  // عدد مرات الاستخدام في أوامر العمل
  _count: {
    select: {
      workOrderInventory: true,
    },
  },
} satisfies Prisma.InventoryItemSelect;