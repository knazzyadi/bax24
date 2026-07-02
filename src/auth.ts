// src/auth.ts
import NextAuth, { AuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { prisma } = await import("./lib/prisma");
        const bcrypt = (await import("bcryptjs")).default;

        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { role: true, company: true },
        });

        if (!user || !user.password) return null;
        if (user.status === false) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        let branchIds: string[] = [];
        try {
          const userBranches = await prisma.userBranch.findMany({
            where: { userId: user.id },
            select: { branchId: true },
          });
          branchIds = userBranches.map((ub: any) => ub.branchId);
        } catch (error) {
          console.warn("UserBranch error:", error);
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

// ✅ تصدير NextAuth handler كافتراضي للـ API Routes
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// ✅ دالة مساعدة للحصول على الجلسة في Server Components و Route Handlers
// في Next.js 14، يمكن استخدامها مباشرة في Route Handlers دون تمرير السياق
export async function auth() {
  return getServerSession(authOptions);
}