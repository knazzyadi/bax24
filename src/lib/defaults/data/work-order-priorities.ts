// src/lib/defaults/data/work-order-priorities.ts

export interface DefaultWorkOrderPriority {
  name: string;
  nameEn: string; // 🔑 هذا هو المفتاح الطبيعي
  code?: string | null;
  color: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export const defaultWorkOrderPriorities: DefaultWorkOrderPriority[] = [
  {
    name: "منخفضة",
    nameEn: "Low",
    code: null,
    color: "#008000",
    order: 1,
    isDefault: false,
    isActive: true,
  },
  {
    name: "متوسطة",
    nameEn: "Medium",
    code: null,
    color: "#FFFF00",
    order: 2,
    isDefault: true,
    isActive: true,
  },
  {
    name: "عالية",
    nameEn: "High",
    code: null,
    color: "#FFA500",
    order: 3,
    isDefault: false,
    isActive: true,
  },
  {
    name: "حرجة",
    nameEn: "Critical",
    code: null,
    color: "#FF0000",
    order: 4,
    isDefault: false,
    isActive: true,
  },
];