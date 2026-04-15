import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email === "admin@bax24.com" && credentials?.password === "123456") {
          return { id: "1", name: "Admin", email: "admin@bax24.com" };
        }
        return null;
      }
    })
  ],
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
});