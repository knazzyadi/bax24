import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@prisma/client', 'prisma'],
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
};

// ✅ لف التكوين بـ withBundleAnalyzer (يُفعَّل فقط عند ANALYZE=true)
export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(withNextIntl(nextConfig));