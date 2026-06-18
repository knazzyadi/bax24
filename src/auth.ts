import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        console.log("EMAIL:", credentials.email);
        console.log("USER FOUND:", user);
        console.log("PASSWORD IN DB:", user?.password);

        if (!user || !user.password) return null;
        if (user.status === false) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        // ✅ جلب قائمة الفروع من جدول UserBranch فقط (بدون user.branchId)
        let branchIds: string[] = [];
        try {
          if (prisma.userBranch) {
            const userBranches = await prisma.userBranch.findMany({
              where: { userId: user.id },
              select: { branchId: true },
            });
            branchIds = userBranches.map((ub: { branchId: string }) => ub.branchId);
          }
        } catch (error) {
          console.warn("UserBranch table not found or error fetching branches:", error);
        }
        // إزالة القيم المكررة
        branchIds = [...new Set(branchIds)];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role?.name || "USER",
          companyId: user.companyId,
          companyName: user.company?.name,
          companyNameEn: user.company?.nameEn,
          branchId: null, // ✅ لم نعد نستخدم user.branchId، نعطيه قيمة null
          branchIds,
        };
      },
    }),
  ],

  pages: { signIn: "/login" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
        token.companyNameEn = user.companyNameEn;
        token.branchId = user.branchId; // سيكون null
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
        session.user.branchId = token.branchId as string | null; // قد يكون null
        session.user.branchIds = token.branchIds as string[] | null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});