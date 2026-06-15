import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  // منع تجميع الحزم الخاصة بالخادم (server-only) لحل مشكلة bcryptjs و Prisma في Vercel
  serverExternalPackages: ['bcryptjs', '@prisma/client', 'prisma'],

  // إعدادات Turbopack للتطوير المحلي فقط (لن تؤثر على بيئة الإنتاج في Vercel)
  ...(process.env.NODE_ENV === 'development' && {
    turbopack: {
      root: __dirname,
    },
  }),

  // إضافة أي إعدادات أخرى ضرورية (إذا وجدت)
  // مثال: تجاوز أخطاء SSL مؤقتة (غير موصى به للإنتاج)
  // ... (يمكنك إضافة إعداداتك هنا)
};

export default withNextIntl(nextConfig);