// src/lib/shared/types/user.ts
export interface SharedUser {
  id: string;
  name: string | null;
  email: string;
  role: {
    id: string;
    name: string;
    label: string | null;
  };
  status: boolean;
  createdAt: string;
  branches?: {
    id: string;
    name: string;
  }[];
}

export interface SharedBranch {
  id: string;
  name: string;
  nameEn?: string;
}

export interface SharedUserFilters {
  search?: string;
  roleId?: string;
  status?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SharedPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}