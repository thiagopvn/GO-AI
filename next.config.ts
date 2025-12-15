import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimizações de performance
  reactStrictMode: true,

  // Otimização de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Compilador otimizado
  compiler: {
    // Remove console.log em produção
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Otimizações experimentais
  experimental: {
    // Otimiza imports de pacotes grandes
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-scroll-area',
    ],
  },
};

export default nextConfig;
