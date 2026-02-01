import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Enable strict mode
  reactStrictMode: true,
  
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
