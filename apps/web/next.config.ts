import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", // Required for Docker deployment
  transpilePackages: ["@symma/shared-types", "@symma/ui", "@symma/i18n"],
  reactCompiler: true,
};

export default withNextIntl(nextConfig);
