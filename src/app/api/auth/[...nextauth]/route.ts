import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// منع التخزين المؤقت لاستجابة API المصادقة (لأغراض التطوير والإنتاج)
export const dynamic = 'force-dynamic';