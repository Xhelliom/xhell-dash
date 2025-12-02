import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode standalone pour Docker : crée un dossier .next/standalone avec uniquement les fichiers nécessaires
  output: 'standalone',
  
  // Permettre les images externes (pour les logos)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
