const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.pstatic.net' },       // 치지직 프사 CDN
      { protocol: 'https', hostname: '**.naver.net' },
      { protocol: 'https', hostname: '**.supabase.co' },       // Supabase Storage
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
};

module.exports = withPWA(nextConfig);
