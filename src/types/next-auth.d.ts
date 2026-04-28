//src\types\next-auth.d.ts
//هو الذي “يعلّم TypeScript” أن بيانات المستخدم في NextAuth ليست افتراضية
import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      companyId?: string | null;
      companyName?: string | null;
      companyNameEn?: string | null;
      branchId?: string | null;
      branchIds?: string[] | null; // 🔥 إضافة
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;
    companyNameEn?: string | null;
    branchId?: string | null;
    branchIds?: string[] | null; // 🔥 إضافة
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;
    companyNameEn?: string | null;
    branchId?: string | null;
    branchIds?: string[] | null; // 🔥 إضافة
  }
}