/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this to handle media files better
  assetPrefix: '',
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm)$/i,
      use: [{
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media',
          outputPath: 'static/media',
          name: '[name].[hash].[ext]',
        },
      }],
    });
    return config;
  },
};

module.exports = nextConfig;