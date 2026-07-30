// src/lib/defaults/data/asset-types.ts

export interface DefaultAssetType {
  name: string;
  nameEn: string; // 🔑 المفتاح الطبيعي
  code?: string | null;
  description?: string | null;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export const defaultAssetTypes: DefaultAssetType[] = [
  {
    name: "أنظمة التكييف والتهوية",
    nameEn: "HVAC Systems",
    code: "AC",
    description: null,
    order: 1,
    isDefault: false,
    isActive: true,
  },
  {
    name: "أنظمة مكافحة الحريق والإنذار",
    nameEn: "Fire Fighting & Alarm Systems",
    code: "FS",
    description: null,
    order: 2,
    isDefault: false,
    isActive: true,
  },
  {
    name: "المعدات والأجهزة الطبية",
    nameEn: "Medical Equipment",
    code: "Me",
    description: null,
    order: 3,
    isDefault: false,
    isActive: true,
  },
  {
    name: "أنظمة تقنية المعلومات",
    nameEn: "Information Technology Systems",
    code: "IT",
    description: null,
    order: 4,
    isDefault: false,
    isActive: true,
  },
  {
    name: "أنظمة الأمن والمراقبة",
    nameEn: "Security & Surveillance Systems",
    code: "SS",
    description: null,
    order: 5,
    isDefault: false,
    isActive: true,
  },
  {
    name: "أنظمة كهربائية",
    nameEn: "Electrical Systems",
    code: "ES",
    description: null,
    order: 6,
    isDefault: false,
    isActive: true,
  },
  {
    name: "أنظمة السباكة",
    nameEn: "Plumbing & Sanitary Systems",
    code: "PL",
    description: null,
    order: 7,
    isDefault: false,
    isActive: true,
  },
  {
    name: "أنظمة المصاعد",
    nameEn: "Elevators & Escalators",
    code: "EL",
    description: null,
    order: 8,
    isDefault: false,
    isActive: true,
  },
];