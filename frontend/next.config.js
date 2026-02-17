/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASS: process.env.ADMIN_PASS,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    TIMEZONE: process.env.TIMEZONE || 'America/Lima',
  },
};

module.exports = nextConfig;
