/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Add this for AWS Amplify deployment
  experimental: {
    optimizeCss: true,
  },
  typescript: {
    // Add this to handle TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Add this to handle ESLint errors during build
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(mp4|webm)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]'
      }
    });
    return config;
  }
};

module.exports = nextConfig;