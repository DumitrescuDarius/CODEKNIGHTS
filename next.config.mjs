/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverExternalPackages: ["@prisma/client", "prisma"],
  },
};

export default nextConfig;
