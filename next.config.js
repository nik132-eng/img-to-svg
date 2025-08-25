/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Handle native modules
  serverExternalPackages: ['@neplex/vectorizer'],
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Bundle optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei'],
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Development-specific optimizations
    if (dev) {
      // Disable aggressive optimizations in development
      config.optimization.minimize = false;
      config.optimization.splitChunks = false;
    }
    
    if (!isServer) {
      // Client-side fallbacks for native modules
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
    
    if (!dev && !isServer) {
      // Production optimizations - minimal chunk splitting to avoid ChunkLoadError
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
        maxSize: 500000, // Larger chunks to reduce splitting
      };
      
      // Minimal tree shaking
      config.optimization.usedExports = false;
      config.optimization.sideEffects = false;
    }
    
    return config;
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
