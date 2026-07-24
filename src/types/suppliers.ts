// src/types/suppliers.ts

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  nameEn?: string | null;
  contactPerson?: string | null; // ✅ بدلاً من code
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormData {
  name: string;
  nameEn?: string | null;
  contactPerson?: string | null; // ✅ بدلاً من code
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive: boolean;
}

export interface SupplierFilters {
  search: string;
  isActive?: boolean;
  sortBy: 'name' | 'contactPerson' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}