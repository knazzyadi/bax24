import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

// ==========================
// NextAuth Session Types
// ==========================
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      companyId?: string | null;
      companyName?: string | null;
      companyNameEn?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;
    companyNameEn?: string | null;
  }
}

// ==========================
// JWT Types
// ==========================
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;
    companyNameEn?: string | null;
  }
}