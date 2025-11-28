import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add empty turbopack config to silence webpack/turbopack warning
  turbopack: {},
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^http:\/\/192\.168\.1\.1\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "router-api",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60, // 1 minute
        },
      },
    },
  ],
})(nextConfig) as NextConfig;
