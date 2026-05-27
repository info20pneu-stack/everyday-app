import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.coingecko.com' },
      { protocol: 'https', hostname: 'assets.coincap.io' },
      { protocol: 'https', hostname: '**.mzstatic.com' },
    ],
  },
};

export default nextConfig;
