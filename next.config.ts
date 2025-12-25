import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow Turbopack to use system certificates so font downloads succeed in
    // restricted TLS environments during builds.
    turbopackUseSystemTlsCerts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  turbopack: {
    // Force the workspace root to this package to avoid accidental parent lockfile detection warnings.
    root: __dirname,
  },
};

export default nextConfig;
