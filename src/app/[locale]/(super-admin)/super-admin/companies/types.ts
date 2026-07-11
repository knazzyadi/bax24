// src/app/[locale]/(super-admin)/super-admin/companies/types.ts
export interface Company {
  id: string;
  name: string;
  nameEn?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionEndDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    branches: number;
    assets: number;
  };
}

export interface CompanyFormData {
  name: string;
  nameEn: string;
  email: string;
  phone: string;
  address: string;
  subscriptionEndDate: string;
  isActive: boolean;
}