// src/auth.config.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// ✅ هذا الملف خفيف جداً - لا يستورد prisma أو bcrypt
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // ❌ authorize فارغة (لن تُستخدم هنا)
      async authorize() {
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});