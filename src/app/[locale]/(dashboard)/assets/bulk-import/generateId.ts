// src/app/[locale]/(dashboard)/assets/bulk-import/utils/generateId.ts

export function generateId(): string {
  // محاولة استخدام crypto.randomUUID() إذا كان متاحاً
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // بديل آمن للمتصفحات القديمة وبيئة Node.js أثناء SSR
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}