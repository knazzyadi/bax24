// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "./options"; // ✅ استيراد من نفس المجلد

const handler = NextAuth(authOptions);

// ✅ تصدير التوابع مباشرة
export const GET = handler;
export const POST = handler;

// ✅ إعدادات إضافية (اختيارية)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;