import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable strict mode
  reactStrictMode: true,

  // Deploy under /GoMedChina subpath
  basePath: '/GoMedChina',
  assetPrefix: '/GoMedChina',

  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.hefunder.cn',
      },
      {
        protocol: 'https',
        hostname: '**.tencentcos.cn',
      },
    ],
  },
};

export default nextConfig;
