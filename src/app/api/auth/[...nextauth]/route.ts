// src/app/api/auth/[...nextauth]/route.ts - NextAuth v4
import NextAuth from "next-auth";
import { authOptions } from "@/auth";

// ✅ في v4، NextAuth(authOptions) يُرجع handler مباشرة
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;