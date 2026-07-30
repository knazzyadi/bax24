// src/lib/defaults/data/work-order-types.ts

export interface DefaultWorkOrderType {
  name: string;
  nameEn: string; // 🔑 المفتاح الطبيعي
  code?: string | null;
  description?: string | null;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export const defaultWorkOrderTypes: DefaultWorkOrderType[] = [
  {
    name: "صيانة تصحيحية",
    nameEn: "Corrective Maintenance",
    code: null,
    description: null,
    order: 1,
    isDefault: true,
    isActive: true,
  },
  {
    name: "صيانة طارئة",
    nameEn: "Emergency Maintenance",
    code: null,
    description: null,
    order: 2,
    isDefault: false,
    isActive: true,
  },
  {
    name: "صيانة وقائية",
    nameEn: "Preventative Maintenance",
    code: null,
    description: null,
    order: 3,
    isDefault: false,
    isActive: true,
  },
  {
    name: "صيانة تحسينية",
    nameEn: "Improvement Maintenance",
    code: null,
    description: null,
    order: 4,
    isDefault: false,
    isActive: true,
  },
  {
    name: "صيانة عامة",
    nameEn: "General Maintenance",
    code: null,
    description: null,
    order: 5,
    isDefault: false,
    isActive: true,
  },
];