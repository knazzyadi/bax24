import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      companyId?: string | null;
      companyName?: string | null;
      companyNameEn?: string | null;
      branchId?: string | null;
      branchIds?: string[] | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    companyId?: string | null;
    companyName?: string | null;
    companyNameEn?: string | null;
    branchId?: string | null;
    branchIds?: string[] | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;
    companyNameEn?: string | null;
    branchId?: string | null;
    branchIds?: string[] | null;
  }
}