/**
 * Middleware d'authentification et RBAC
 * Protection des routes et vérification des permissions
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getUserPermissions, hasPermission, Permission } from '../rbac/roles';
import { createAuditLog } from '../services/audit.service';

/**
 * Middleware principal pour l'authentification
 */
export async function authMiddleware(request: NextRequest) {
  const session = await auth();

  // Routes publiques (pas besoin d'authentification)
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return null; // Pas de blocage
  }

  // Vérifier l'authentification
  if (!session?.user) {
    // Log tentative d'accès non authentifié
    await createAuditLog('PERMISSION_DENIED', {
      metadata: { 
        path: request.nextUrl.pathname,
        reason: 'Not authenticated' 
      },
    });

    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Vérifier que l'utilisateur est actif
  if (session.user.statut !== 'ACTIF') {
    await createAuditLog('PERMISSION_DENIED', {
      user_id: session.user.id,
      metadata: { 
        path: request.nextUrl.pathname,
        reason: 'User not active' 
      },
    });

    return NextResponse.redirect(new URL('/login?error=inactive', request.url));
  }

  return null; // Authentification OK
}

/**
 * Middleware RBAC pour vérifier les permissions
 */
export async function rbacMiddleware(
  request: NextRequest,
  requiredPermission: Permission | Permission[]
): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Récupérer les permissions de l'utilisateur
  const userPermissions = getUserPermissions(
    session.user.role_principal as any,
    (session.user.roles_secondaires || []) as any[]
  );

  // Vérifier la permission
  const hasAccess = Array.isArray(requiredPermission)
    ? requiredPermission.some(perm => hasPermission(userPermissions, perm))
    : hasPermission(userPermissions, requiredPermission);

  if (!hasAccess) {
    // Log tentative d'accès non autorisé
    await createAuditLog('PERMISSION_DENIED', {
      user_id: session.user.id,
      metadata: { 
        path: request.nextUrl.pathname,
        required_permission: Array.isArray(requiredPermission) 
          ? requiredPermission 
          : [requiredPermission],
        user_permissions: userPermissions,
        reason: 'Insufficient permissions' 
      },
    });

    return NextResponse.json(
      { error: 'Accès refusé. Permissions insuffisantes.' },
      { status: 403 }
    );
  }

  return null; // Permission OK
}

/**
 * Helper pour protéger une route avec une permission
 */
export function withPermission(requiredPermission: Permission | Permission[]) {
  return async (request: NextRequest) => {
    // D'abord vérifier l'authentification
    const authResult = await authMiddleware(request);
    if (authResult) return authResult;

    // Ensuite vérifier la permission
    return await rbacMiddleware(request, requiredPermission);
  };
}

