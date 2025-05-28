import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      { // Added for local image previews if files are served from dev server.
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb', // Increased for file uploads, adjust as needed
    },
  },
};

export default nextConfig;
