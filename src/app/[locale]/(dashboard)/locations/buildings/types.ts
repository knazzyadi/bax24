// src/app/[locale]/(dashboard)/locations/buildings/types.ts

export interface Building {
  id: string;
  name: string;
  nameEn: string | null;
  code: string;
  order: number;
  branchId: string | null;
  branchName: string | null;
}

export interface Branch {
  id: string;
  name: string;
}

export interface BuildingFormData {
  name: string;
  nameEn: string;
  code: string;
  order: number;
  branchId: string;
}

export interface BuildingFilters {
  search: string;
  branchId: string;
  sortBy: 'name' | 'code' | 'order' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}