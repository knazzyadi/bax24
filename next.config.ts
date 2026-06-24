import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@prisma/client', 'prisma'],
  serverExternalPackages: ['bcryptjs'],
  // ❌ تم حذف كتلة turbopack (غير ضرورية للبناء)
  // ❌ تم حذف webpack.alias (لم يعد مطلوباً لأن العميل في node_modules)
  webpack: (config: any) => {
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals = config.externals.filter(
        (external: any) => external !== '@prisma/client' && external !== 'prisma'
      );
    }
    // ✅ تم حذف config.resolve.alias بالكامل
    return config;
  },
};

export default withNextIntl(nextConfig);