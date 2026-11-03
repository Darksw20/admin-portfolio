/** @type {import('next').NextConfig} */
const nextConfig = {
  // A production build must not overwrite chunks used by a running dev server.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
}

module.exports = nextConfig
