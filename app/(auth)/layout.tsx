/**
 * Layout pour les routes d'authentification
 * Pas de protection, accessible sans authentification
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

