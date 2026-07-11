// src/app/[locale]/(super-admin)/super-admin/branches/types.ts
export interface Branch {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
  companyId: string;
  slug?: string;
  publicToken?: string;
  allowPublicTickets?: boolean;
  createdAt: string;
  updatedAt: string;
  company: {
    name: string;
  };
}

export interface Company {
  id: string;
  name: string;
}

export interface BranchFormData {
  name: string;
  nameEn: string;
  code: string;
  companyId: string;
}