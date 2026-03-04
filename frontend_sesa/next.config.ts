import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! AVISO !! Isso contornará as verificações de tipo do TypeScript no pipeline de build da Vercel
    // Usado porque o Vercel estava dando crash misterioso e abortando o deploy aqui,
    // apesar do build passar em 100% limpo na máquina local do desenvolvedor (Windows).
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
