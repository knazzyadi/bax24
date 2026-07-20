// src/types/next-auth.d.ts

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      companyId?: string | null;
      companyName?: string | null;     // ✅ أضفنا
      companyNameEn?: string | null;   // ✅ أضفنا
      branchId?: string | null;
      branchIds?: string[] | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;       // ✅ أضفنا
    companyNameEn?: string | null;     // ✅ أضفنا
    branchId?: string | null;
    branchIds?: string[] | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;       // ✅ أضفنا
    companyNameEn?: string | null;     // ✅ أضفنا
    branchId?: string | null;
    branchIds?: string[] | null;
  }
}