import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração do Turbopack (nova sintaxe)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  // Configurações do Webpack (mantidas para compatibilidade)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
