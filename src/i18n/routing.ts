//src\i18n\routing.ts
//إعداد نظام الترجمة وتوجيه اللغات (i18n routing) في التطبيق باستخدام next-intl
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always',
});