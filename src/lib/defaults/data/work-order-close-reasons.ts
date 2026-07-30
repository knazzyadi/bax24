// src/lib/defaults/data/work-order-close-reasons.ts

export interface DefaultWorkOrderCloseReason {
  name: string;
  nameEn: string; // 🔑 المفتاح الطبيعي
  code?: string | null;
  description?: string | null;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export const defaultWorkOrderCloseReasons: DefaultWorkOrderCloseReason[] = [
  {
    name: "تم الإنجاز بالكامل",
    nameEn: "Completed Successfully",
    code: null,
    description: null,
    order: 1,
    isDefault: true,
    isActive: true,
  },
  {
    name: "انتهاء الفحص الفني",
    nameEn: "Technical Inspection Done",
    code: null,
    description: null,
    order: 2,
    isDefault: false,
    isActive: true,
  },
  {
    name: "الدمج مع أمر آخر",
    nameEn: "Merged with Another Order",
    code: null,
    description: null,
    order: 3,
    isDefault: false,
    isActive: true,
  },
  {
    name: "التحويل لجهة خارجية",
    nameEn: "Outsourced to Contractor",
    code: null,
    description: null,
    order: 4,
    isDefault: false,
    isActive: true,
  },
];