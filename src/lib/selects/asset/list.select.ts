// src/lib/selects/asset/list.select.ts
import { Prisma } from '@prisma/client';

export const assetListSelect = {
  id: true,
  code: true,
  name: true,
  nameEn: true,
  purchaseDate: true,
  warrantyEnd: true,
  notes: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  lastMaintenanceDate: true,
  
  // العلاقات الأساسية للعرض
  type: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      // ❌ color غير موجود في AssetType، أزلناه
    },
  },
  status: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      color: true, // ✅ موجود في AssetStatus
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
              branch: {
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
    },
  },
  building: {
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
} satisfies Prisma.AssetSelect;