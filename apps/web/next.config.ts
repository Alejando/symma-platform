import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@symma/shared-types", "@symma/ui"],
  reactCompiler: true,
};

export default nextConfig;
