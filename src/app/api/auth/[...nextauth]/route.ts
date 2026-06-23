// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

// التحقق من وجود handlers قبل التصدير (لتحديد المشكلة مبكراً)
if (!handlers) {
  throw new Error(
    "❌ handlers is undefined. Please verify that auth.ts exports handlers correctly."
  );
}

// تصدير معالجات GET و POST للمصادقة
export const { GET, POST } = handlers;

// إعدادات لمنع التخزين المؤقت وتحسين الأداء في بيئة Serverless
export const dynamic = 'force-dynamic';    // منع التخزين المؤقت للصفحة
export const runtime = 'nodejs';           // تحديد بيئة التشغيل (ضروري لـ NextAuth)
export const fetchCache = 'force-no-store'; // تعطيل التخزين المؤقت للـ fetch
export const revalidate = 0;               // إعادة التحقق الفورية (عدم التخزين المؤقت)