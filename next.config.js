/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@neplex/vectorizer'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Handle native modules
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    return config;
  },
  // Disable server-side rendering for the API route that uses native modules
  async headers() {
    return [
      {
        source: '/api/convert',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
