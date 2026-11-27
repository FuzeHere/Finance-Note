import type { NextConfig } from "next";

const isMobileExport = process.env.MOBILE_EXPORT === "1";

const nextConfig: NextConfig = {
  output: isMobileExport ? "export" : "standalone",
  ...(isMobileExport ? { images: { unoptimized: true } } : {}),
  serverExternalPackages: ["node:sqlite"],
};

export default nextConfig;
