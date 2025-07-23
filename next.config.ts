import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Desabilitar prerendering para páginas que dependem de autenticação
    workerThreads: false,
  },
};

export default nextConfig;
