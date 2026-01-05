/**
 * Helpers pour récupérer la session utilisateur
 * Utilisé dans les Server Components et Server Actions
 */

import { auth } from '@/auth';

/**
 * Récupère la session utilisateur côté serveur
 */
export async function getSession() {
  return await auth();
}

/**
 * Récupère l'utilisateur actuel depuis la session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * Récupère l'ID utilisateur actuel
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

