// src/auth.ts
import NextAuth, { AuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth-credentials";

// ============================================
//  خيارات المصادقة (AuthOptions)
// ============================================
export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // ✅ استخدام الدالة المستوردة من auth-credentials.ts
      authorize: authorizeCredentials,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
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
  secret: process.env.NEXTAUTH_SECRET,
};

// ============================================
//  تصدير معالج NextAuth للـ API Routes
// ============================================
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// ============================================
//  دالة مساعدة للحصول على الجلسة
//  (تُستخدم في auth-guard.ts و authz.ts)
// ============================================
export async function auth() {
  return getServerSession(authOptions);
}