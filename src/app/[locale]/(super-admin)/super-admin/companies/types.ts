export interface Company {
  id: string;
  name: string;
  nameEn?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  subscriptionEndDate?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
  _count?: {
    users: number;
    branches: number;
    assets: number;
  };
}

export interface CompanyFormData {
  name: string;
  nameEn?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  subscriptionEndDate?: string | null;
  isActive?: boolean;
}