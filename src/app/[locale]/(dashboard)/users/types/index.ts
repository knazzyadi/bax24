export interface User {
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

export interface Branch {
  id: string;
  name: string;
  nameEn?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  roleId: string;
  branchIds: string[];
}

export interface UserFilters {
  search: string;
  roleId: string;
  status?: boolean;
}