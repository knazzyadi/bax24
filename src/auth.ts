import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ============================================
// Types Augmentation (بدون استيراد DefaultJWT)
// ============================================
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;
    permissions?: string[];
  }

  interface Session {
    user: {
      id: string;
      role: string;
      companyId?: string | null;
      companyName?: string | null;
      permissions?: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    companyId?: string | null;
    companyName?: string | null;
    permissions?: string[];
    remember?: boolean;
    exp?: number;
  }
}

// ============================================
// Prisma Singleton (احترافي)
// ============================================
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ============================================
// NextAuth Config
// ============================================
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,   // ✅ حل مشكلة UntrustedHost على Render

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            role: true,
            company: true,
          },
        });

        if (!user || !user.password) return null;
        if (user.status === false) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          role: user.role?.name ?? "USER",
          companyId: user.companyId ?? null,
          companyName: user.company?.name ?? null,
          permissions: [],
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
        token.companyId = user.companyId ?? null;
        token.companyName = user.companyName ?? null;
        token.permissions = user.permissions ?? [];
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId ?? null;
        session.user.companyName = token.companyName ?? null;
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});