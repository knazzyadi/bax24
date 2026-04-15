import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async (params) => {
  // Next.js 15: params هو Promise
  const { locale } = await params;
  
  const locales = ['ar', 'en'];
  const defaultLocale = 'en';
  
  // إذا كانت اللغة غير مدعومة، استخدم الافتراضية
  const safeLocale = locales.includes(locale) ? locale : defaultLocale;
  
  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});