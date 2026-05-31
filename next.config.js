/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode
  reactStrictMode: true,

  // Deploy under /GoMedChina subpath
  basePath: '/gochinamed',
  assetPrefix: '/gochinamed',

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
