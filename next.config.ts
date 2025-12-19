import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Force the workspace root to this package to avoid accidental parent lockfile detection warnings.
    root: __dirname,
  },
};

export default nextConfig;
