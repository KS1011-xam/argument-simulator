/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 明确告诉Next.js页面目录在src/pages
  distDir: '.next',
  dir: '.'
};

module.exports = nextConfig;
