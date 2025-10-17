import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
  transpilePackages: [
    '@fortawesome/fontawesome-svg-core',
    '@fortawesome/free-regular-svg-icons',
    '@fortawesome/free-solid-svg-icons',
    '@fortawesome/free-brands-svg-icons',
    '@fortawesome/react-fontawesome',
  ],
  // Security: Request body size limits to prevent DOS attacks
  experimental: {
    // Maximum request body size (10MB for admin operations with images)
    // Individual routes can implement stricter limits if needed
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
