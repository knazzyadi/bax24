// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

// ✅ تصدير مباشر (أكثر استقراراً في Vercel)
export const { GET, POST } = handlers;

// ✅ إعدادات بيئة التشغيل
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;