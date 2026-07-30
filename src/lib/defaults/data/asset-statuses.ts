// src/lib/defaults/data/asset-statuses.ts

export interface DefaultAssetStatus {
  name: string;
  nameEn: string; // 🔑 المفتاح الطبيعي
  code?: string | null;
  color: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export const defaultAssetStatuses: DefaultAssetStatus[] = [
  {
    name: "يعمل بكفاءة",
    nameEn: "Active",
    code: null,
    color: "#008000",
    order: 1,
    isDefault: false,
    isActive: true,
  },
  {
    name: "تحت الصيانة",
    nameEn: "Under Maintenance",
    code: null,
    color: "#FFA500",
    order: 2,
    isDefault: false,
    isActive: true,
  },
  {
    name: "احتياطي",
    nameEn: "In Storage",
    code: null,
    color: "#0000FF",
    order: 3,
    isDefault: false,
    isActive: true,
  },
  {
    name: "خارج الخدمة",
    nameEn: "Out of Service",
    code: null,
    color: "#FF0000",
    order: 4,
    isDefault: false,
    isActive: true,
  },
  {
    name: "تالف",
    nameEn: "Scrapped",
    code: null,
    color: "#808080",
    order: 5,
    isDefault: false,
    isActive: true,
  },
];