import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack due to issues with Japanese path names
  // turbopack: false, // This option may not exist in Next.js 16 yet

  // Experimental features
  experimental: {
    // Empty for now
  },
};

export default nextConfig;
