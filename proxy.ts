/**
 * Middleware Next.js global
 * Applique l'authentification et le RBAC sur toutes les routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from './lib/auth/middleware';

export async function proxy(request: NextRequest) {
  // Appliquer le middleware d'authentification
  const authResult = await authMiddleware(request);
  if (authResult) {
    return authResult;
  }

  // Continuer la requête
  return NextResponse.next();
}

// Configuration des routes à protéger
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

