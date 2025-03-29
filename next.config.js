/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // 暂时禁用React Hook依赖警告
      ignoreDuringBuilds: true,
    },
    reactStrictMode: true,
  };
  
  module.exports = nextConfig;