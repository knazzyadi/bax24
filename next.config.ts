import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ نضع @prisma/client و prisma في transpilePackages فقط
  transpilePackages: ['@prisma/client', 'prisma'],
  // ✅ نترك bcryptjs فقط في serverExternalPackages (لا يحتاج تجميع)
  serverExternalPackages: ['bcryptjs'],
  webpack: (config: any) => {
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals = config.externals.filter(
        (external: any) => external !== '@prisma/client' && external !== 'prisma'
      );
    }
    return config;
  },
  experimental: {
    serverMinification: false,
  },
};

export default withNextIntl(nextConfig);