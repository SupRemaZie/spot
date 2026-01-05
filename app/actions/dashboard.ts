/**
 * Server Actions pour les dashboards
 */

'use server';

import { getDashboardByRole, getDashboardGlobal, getDashboardChefProjet, getDashboardMembre, getDashboardDirection } from '@/lib/services/dashboard.service';
import { getCurrentUser } from '@/lib/auth/session';
import { RolePrincipal } from '@/lib/types/membre.types';

/**
 * Récupère le dashboard selon le rôle de l'utilisateur
 */
export async function getDashboardAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    const dashboard = await getDashboardByRole(
      user.id,
      user.role_principal as RolePrincipal
    );

    return { success: true, dashboard, role: user.role_principal };
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère le dashboard global (Admin/Directeur)
 */
export async function getDashboardGlobalAction() {
  try {
    const dashboard = await getDashboardGlobal();
    return { success: true, dashboard };
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard global:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère le dashboard chef de projet
 */
export async function getDashboardChefProjetAction(membreId: string) {
  try {
    const dashboard = await getDashboardChefProjet(membreId);
    return { success: true, dashboard };
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard chef de projet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère le dashboard membre
 */
export async function getDashboardMembreAction(membreId: string) {
  try {
    const dashboard = await getDashboardMembre(membreId);
    return { success: true, dashboard };
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard membre:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère le dashboard direction
 */
export async function getDashboardDirectionAction() {
  try {
    const dashboard = await getDashboardDirection();
    return { success: true, dashboard };
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard direction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

