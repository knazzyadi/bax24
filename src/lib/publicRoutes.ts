// src/lib/publicRoutes.ts

/**
 * قائمة المسارات العامة (التي يظهر فيها الهيدر والفوتر)
 * يتم كتابة المسار بعد الـ locale مباشرة، بدون斜杠 في البداية
 * مثال: '/ar/login' -> 'login'
 *       '/en' -> ''
 */
export const publicRoutes: string[] = [
  '',                 // الصفحة الرئيسية /en or /ar
  'login',
  'register',
  'privacy',
  'terms',
  'reset-password',
  'forgot-password',
];

/**
 * دالة مساعدة للتحقق مما إذا كان المسار عاماً
 * @param path المسار بعد إزالة الـ locale
 * @returns true إذا كان عاماً، false إذا كان خاصاً
 */
export function isPublicRoute(path: string): boolean {
  const cleanPath = path.replace(/^\/|\/$/g, ''); // إزالة / من البداية والنهاية
  return publicRoutes.includes(cleanPath);
}