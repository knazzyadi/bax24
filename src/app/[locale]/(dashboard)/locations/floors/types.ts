// src/app/[locale]/(dashboard)/locations/floors/types.ts

export interface Floor {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
  buildingId: string;
  building: {
    id: string;
    name: string;
  };
}

export interface Building {
  id: string;
  name: string;
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
  sortBy: 'name' | 'code' | 'order' | 'buildingId';
  sortOrder: 'asc' | 'desc';
}