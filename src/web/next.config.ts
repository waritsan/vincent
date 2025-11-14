import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Proxy API calls to Azure Functions in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:7071/api/:path*',
      },
    ];
  },
  // Note: i18n is not supported with output: 'export'
  // Language is set via html lang attribute in layout.tsx
};

export default nextConfig;
