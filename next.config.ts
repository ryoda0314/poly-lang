import type { NextConfig } from "next";

import nextPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache";

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
