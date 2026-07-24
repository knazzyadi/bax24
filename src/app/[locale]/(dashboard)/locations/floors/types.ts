// src/app/[locale]/(dashboard)/locations/floors/types.ts

export interface Building {
  id: string;
  name: string;
  nameEn?: string | null; // ✅ السماح بـ null
  code?: string; // ✅ إضافة code اختياري
}

export interface Floor {
  id: string;
  name: string;
  nameEn?: string | null; // ✅ التغيير الجوهري: السماح بـ null
  code: string;
  order: number;
  buildingId: string;
  building?: {
    id: string;
    name: string;
    nameEn?: string | null;
    code?: string;
  };
}

export interface FloorFormData {
  name: string;
  nameEn: string;
  code: string;
  order: number;
  buildingId: string;
}

export interface FloorFilters {
  search: string;
  buildingId: string;
  sortBy:
  | 'name'
  | 'code'
  | 'order'
  | 'createdAt'
  | 'buildingId';
  sortOrder: 'asc' | 'desc';
}