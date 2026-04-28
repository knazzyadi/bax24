//next.config.ts
//ملف إعدادات Next.js الأساسي
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);