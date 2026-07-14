// middleware.ts
// وظيفة الملف
// اعتراض الطلبات قبل وصولها للصفحة
// إدارة اللغة (i18n)

import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["ar", "en"],
  defaultLocale: "en",
  localePrefix: "always",
});

export const config = {
  matcher: [
    "/",
    "/(ar|en)/:path*",
  ],
};