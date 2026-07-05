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

  // ✅ تبسيط العلاقات: احتفظ بالحقوق الأساسية فقط
  type: {
    select: {
      id: true,
      name: true,
      nameEn: true,
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
  // ✅ تبسيط الـ room: لا تتداخل مع floor أو building هنا
  room: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      code: true,
      // ❌ تم إزالة floor (والذي كان يجلب building و branch)
    },
  },
  // ✅ جلب building بشكل منفصل (بدون تداخل)
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