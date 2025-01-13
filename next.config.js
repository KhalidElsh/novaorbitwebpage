/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this to ensure static files are copied
  transpilePackages: [],
  experimental: {
    outputFileTracingIncludes: {
      '/**/*': ['./public/**/*']
    }
  }
};

module.exports = nextConfig;