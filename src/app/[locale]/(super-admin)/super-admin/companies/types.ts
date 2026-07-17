// src/app/[locale]/(super-admin)/super-admin/companies/types.ts
export interface Company {
  id: string;
  name: string;
  nameEn?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionEndDate?: string;
  isActive: boolean;
  code: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ يتطابق مع CompanyFormValues من schemas.ts
export type CompanyFormData = {
  name: string;
  nameEn?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionEndDate?: string;
  isActive: boolean;
};