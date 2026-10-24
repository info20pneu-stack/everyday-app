import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Stack was replaced by Sky Tower
      {
        source: '/daily-games',
        has: [{ type: 'query', key: 'play', value: 'stack' }],
        destination: '/games/sky-tower',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.coingecko.com' },
      { protocol: 'https', hostname: 'assets.coincap.io' },
      { protocol: 'https', hostname: '**.mzstatic.com' },
    ],
  },
};

export default nextConfig;
