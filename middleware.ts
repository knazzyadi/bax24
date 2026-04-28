//middleware.ts
// وظيفة الملف 
// اعتراض الطلبات قبل وصولها للصفحة
// التحكم في إعادة التوجيه (Redirect)
// إدارة اللغة (i18n)
// حماية المسارات (Auth / Locale routing)
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

export default createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export function middleware(request: any) {
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*'],
};