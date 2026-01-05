/**
 * Server Actions pour le reporting et les KPIs
 */

'use server';

import {
  getGlobalKPIs,
  getAvancementStats,
  getRetardStats,
  getTempsStatsPeriode,
  getMembresPerformance,
  getBudgetStats,
} from '@/lib/services/reporting.service';
import { getSession } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * Vérifie les permissions pour les opérations de reporting
 */
async function checkPermission() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Non authentifié');
  }
  // TODO: Implémenter la vérification des permissions
  // Les rapports sont généralement accessibles aux chefs de projet et directeurs
}

/**
 * Récupère les KPIs globaux
 */
export async function getGlobalKPIsAction() {
  try {
    await checkPermission();

    const kpis = await getGlobalKPIs();
    return { success: true, kpis };
  } catch (error) {
    console.error('Erreur lors de la récupération des KPIs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les statistiques d'avancement
 */
export async function getAvancementStatsAction() {
  try {
    await checkPermission();

    const stats = await getAvancementStats();
    return { success: true, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques d\'avancement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stats: [],
    };
  }
}

/**
 * Récupère les statistiques de retard
 */
export async function getRetardStatsAction() {
  try {
    await checkPermission();

    const stats = await getRetardStats();
    return { success: true, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de retard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stats: [],
    };
  }
}

/**
 * Récupère les statistiques de temps par période
 */
export async function getTempsStatsPeriodeAction(
  debut: Date,
  fin: Date
) {
  try {
    await checkPermission();

    const stats = await getTempsStatsPeriode(debut, fin);
    return { success: true, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de temps:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les statistiques de performance des membres
 */
export async function getMembresPerformanceAction() {
  try {
    await checkPermission();

    const performances = await getMembresPerformance();
    return { success: true, performances };
  } catch (error) {
    console.error('Erreur lors de la récupération des performances:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      performances: [],
    };
  }
}

/**
 * Récupère les statistiques de budget
 */
export async function getBudgetStatsAction() {
  try {
    await checkPermission();

    const stats = await getBudgetStats();
    return { success: true, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de budget:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stats: [],
    };
  }
}

