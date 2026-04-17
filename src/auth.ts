import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DefaultSession } from "next-auth";

// ============================================
// توسيع أنواع NextAuth لدعم الخواص المخصصة
// ============================================
declare module "next-auth" {
  interface User {
    role?: string;
    companyId?: string;
  }
  interface Session {
    user: {
      id?: string;
      role?: string;
      companyId?: string;
    } & DefaultSession["user"];
  }
}

// ============================================
// إعداد Prisma Client مع إعادة استخدام الاتصال
// ============================================
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ============================================
// تكوين NextAuth
// ============================================
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            role: true,
            company: true,
          },
        });

        if (!user || !user.password) return null;
        if (user.status === false) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role?.name,
          companyId: user.companyId ?? undefined,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});