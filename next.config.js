/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(mp4|webm)$/,
      type: 'asset/resource',
      generator: {
        // Change this to output to the public directory
        filename: 'static/media/[name][ext]' // Removed [hash] to keep filename consistent
      }
    });
    return config;
  },
  // Add this to ensure static files are copied correctly
  publicRuntimeConfig: {
    staticFolder: '/static',
  }
};

module.exports = nextConfig;