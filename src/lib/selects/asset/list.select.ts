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
  // ✅ جلب الحقول الأساسية فقط من العلاقات (بدون تداخل)
  typeId: true, // سنستخدم هذا لاحقًا لجلب الاسم بطريقة منفصلة أو في العرض
  statusId: true, // نفس الشيء
  roomId: true, // نفس الشيء
  buildingId: true,
  branchId: true,
  // ✅ علاقات خفيفة: فقط المعرفات والبيانات الأساسية للعرض
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
  // ✅ تبسيط الـ room: فقط المعرف والاسم والكود (بدون تداخل floor/building)
  room: {
    select: {
      id: true,
      name: true,
      nameEn: true,
      code: true,
      // ❌ إزالة floor و building من هنا
    },
  },
  // ✅ جلب building و branch بشكل منفصل (بدون تداخل)
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