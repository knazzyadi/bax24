// src/app/[locale]/(super-admin)/super-admin/users/types.ts

export interface User {
  id: string;
  name: string | null;
  email: string;
  status: boolean;
  createdAt: string;
  role: {
    id: string;
    name: string;
    label: string | null;
  } | null;
  company: {
    id: string;
    name: string;
  } | null;
}

export interface Company {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  label: string | null;
}

export interface UserFormData {
  name: string;
  email: string;
  roleId: string;
  companyId: string;
}

export interface UserFilters {
  search: string;
  role: string;
  companyId: string;
}