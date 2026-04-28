//src\i18n\request.ts
//تحميل ملفات الترجمة (messages) حسب لغة المستخدم بشكل آمن في السيرفر باستخدام next-intl.
import { getRequestConfig, GetRequestConfigParams } from 'next-intl/server';

export default getRequestConfig(async ({ locale }: GetRequestConfigParams) => {
  // التأكد من أن locale قيمة صالحة، وإلا استخدام 'en'
  const safeLocale = (locale === 'ar' || locale === 'en') ? locale : 'en';
  
  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});