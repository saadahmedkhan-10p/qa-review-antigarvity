import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Empty turbopack config to silence the warning
  turbopack: {},
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
