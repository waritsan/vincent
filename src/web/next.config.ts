import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Note: i18n is not supported with output: 'export'
  // Language is set via html lang attribute in layout.tsx
};

export default nextConfig;
