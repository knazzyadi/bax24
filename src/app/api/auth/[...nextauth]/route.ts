// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";   // يجب أن يكون المسار صحيحاً لملف auth.ts في جذر src

export const { GET, POST } = handlers;

// منع التخزين المؤقت لاستجابة API المصادقة (لأغراض التطوير والإنتاج)
export const dynamic = 'force-dynamic';