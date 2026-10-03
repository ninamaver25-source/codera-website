import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: false,
  images: {
    qualities: [75, 82],
    deviceSizes: [640, 828, 1080, 1200, 1600, 1920, 2400, 3200],
  },
};

export default nextConfig;
