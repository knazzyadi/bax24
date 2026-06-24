import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@prisma/client', 'prisma'],
  serverExternalPackages: ['bcryptjs', '@prisma/client', 'prisma'],
  webpack: (config: any) => {
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals = config.externals.filter(
        (external: any) => external !== '@prisma/client' && external !== 'prisma'
      );
    }
    return config;
  },
  // ✅ إضافة إعدادات إضافية لتحسين الأداء في Vercel
  experimental: {
    serverMinification: false,
  },
};

export default withNextIntl(nextConfig);