// src/types/session.ts

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'TECHNICIAN'
  | 'USER';

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;

  role: UserRole;

  companyId?: string | null;
  branchIds?: string[];

  image?: string | null;

  permissions?: string[];

  locale?: string;
}

export interface SessionData {
  user: SessionUser;
  expires?: string;
}