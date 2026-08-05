import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

type WebpackConfig = {
  externals?: unknown;
};

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  transpilePackages: ["@prisma/client", "prisma"],

  serverExternalPackages: ["bcryptjs"],

  webpack: (config: WebpackConfig) => {
    config.externals = config.externals || [];

    if (Array.isArray(config.externals)) {
      config.externals = config.externals.filter(
        (external: unknown) =>
          external !== "@prisma/client" &&
          external !== "prisma"
      );
    }

    return config;
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(withNextIntl(nextConfig));