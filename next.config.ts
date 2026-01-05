import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Désactiver Turbopack pour éviter les erreurs de symlink sur Windows
  // Solution: Utiliser le script dev:webpack ou définir NEXT_PRIVATE_DISABLE_TURBO=1
  // L'erreur "create symlink" est un problème connu avec Turbopack sur Windows
};

export default nextConfig;
