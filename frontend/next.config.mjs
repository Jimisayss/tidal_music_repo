/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tidal.401658.xyz'
      },
      {
        protocol: 'https',
        hostname: 'resources.tidal.com'
      },
      {
        protocol: 'https',
        hostname: 'images.tidal.com'
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co'
      }
    ]
  }
};

export default nextConfig;


