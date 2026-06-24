// src/auth.config.ts
import type { NextAuthConfig } from "next-auth";

/**
 * ✅ هذا الملف خفيف جداً - يحتوي فقط على إعدادات (Options) وليس استدعاء NextAuth()
 * ❌ لا يستورد prisma أو bcrypt
 * ❌ لا يستدعي NextAuth() مباشرة
 * ✅ يُستخدم في auth.ts لبناء NextAuth مع PrismaAdapter و authorize الحقيقي
 */
export const authConfig = {
  providers: [], // ❌ فارغ، سيتم إضافتها في auth.ts
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
        token.companyNameEn = user.companyNameEn;
        token.branchId = user.branchId;
        token.branchIds = user.branchIds;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.companyName = token.companyName as string;
        session.user.companyNameEn = token.companyNameEn as string;
        session.user.branchId = token.branchId as string | null;
        session.user.branchIds = token.branchIds as string[] | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;