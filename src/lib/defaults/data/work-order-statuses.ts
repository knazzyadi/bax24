// src/lib/defaults/data/work-order-statuses.ts

export interface DefaultWorkOrderStatus {
  name: string;
  nameEn: string; // 🔑 المفتاح الطبيعي
  code?: string | null;
  color: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export const defaultWorkOrderStatuses: DefaultWorkOrderStatus[] = [
  {
    name: "جديد",
    nameEn: "New",
    code: null,
    color: "#2196F3",
    order: 1,
    isDefault: true,
    isActive: true,
  },
  {
    name: "قيد التنفيذ",
    nameEn: "In Progress",
    code: null,
    color: "#FD7E14",
    order: 2,
    isDefault: false,
    isActive: true,
  },
  {
    name: "قيد الانتظار",
    nameEn: "Pending",
    code: null,
    color: "#DC3545",
    order: 3,
    isDefault: false,
    isActive: true,
  },
  {
    name: "مكتمل",
    nameEn: "Completed",
    code: null,
    color: "#28A745",
    order: 4,
    isDefault: false,
    isActive: true,
  },
  {
    name: "مغلق",
    nameEn: "Closed",
    code: null,
    color: "#6F42C1",
    order: 5,
    isDefault: false,
    isActive: true,
  },
  {
    name: "مرفوض",
    nameEn: "Cancelled",
    code: null,
    color: "#6B7280",
    order: 6,
    isDefault: false,
    isActive: true,
  },
];