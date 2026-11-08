/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'render.worldofwarcraft.com',
      },
      {
        protocol: 'https',
        hostname: '**.blizzard.com',
      },
      {
        protocol: 'https',
        hostname: 'wow.zamimg.com',
      },
    ],
  },
};

export default nextConfig;
