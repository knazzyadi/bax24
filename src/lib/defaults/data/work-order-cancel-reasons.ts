// src/lib/defaults/data/work-order-cancel-reasons.ts

export interface DefaultWorkOrderCancelReason {
  name: string;
  nameEn: string; // 🔑 المفتاح الطبيعي
  code?: string | null;
  description?: string | null;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export const defaultWorkOrderCancelReasons: DefaultWorkOrderCancelReason[] = [
  {
    name: "طلب مكرر",
    nameEn: "Duplicate Request",
    code: null,
    description: null,
    order: 1,
    isDefault: true,
    isActive: true,
  },
  {
    name: "بيانات خاطئة",
    nameEn: "Incorrect Information",
    code: null,
    description: null,
    order: 2,
    isDefault: false,
    isActive: true,
  },
  {
    name: "تغير الاحتياج",
    nameEn: "No Longer Required",
    code: null,
    description: null,
    order: 3,
    isDefault: false,
    isActive: true,
  },
  {
    name: "عدم الجدوى الاقتصادية",
    nameEn: "Uneconomical to Repair",
    code: null,
    description: null,
    order: 4,
    isDefault: false,
    isActive: true,
  },
];