// src/auth.ts - NextAuth v4
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // ✅ استيراد ديناميكي لتجنب تحميل prisma و bcrypt أثناء البناء
        const { prisma } = await import("./lib/prisma");
        const bcrypt = (await import("bcryptjs")).default;

        if (!credentials?.email || !credentials?.password) {
          console.error("❌ Missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { role: true, company: true },
        });

        if (!user) {
          console.error(`❌ User not found: ${credentials.email}`);
          return null;
        }

        if (!user.password) {
          console.error(`❌ User has no password: ${credentials.email}`);
          return null;
        }

        if (user.status === false) {
          console.error(`❌ User inactive: ${credentials.email}`);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          console.error(`❌ Invalid password for: ${credentials.email}`);
          return null;
        }

        let branchIds: string[] = [];
        try {
          const userBranches = await prisma.userBranch.findMany({
            where: { userId: user.id },
            select: { branchId: true },
          });
          branchIds = userBranches.map((ub: { branchId: string }) => ub.branchId);
        } catch (error) {
          console.warn("⚠️ UserBranch fetch error:", error);
        }
        branchIds = [...new Set(branchIds)];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role?.name || "USER",
          companyId: user.companyId,
          companyName: user.company?.name,
          companyNameEn: user.company?.nameEn,
          branchId: null,
          branchIds,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
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

// ✅ في v4، نُصدّر authOptions وليس handlers
export default NextAuth(authOptions);