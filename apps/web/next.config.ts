import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", // Required for Docker deployment
  transpilePackages: ["@symma/shared-types", "@symma/ui"],
  reactCompiler: true,
};

export default nextConfig;
