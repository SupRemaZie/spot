/**
 * Server Actions pour la gestion des feuilles de temps
 * Actions côté serveur pour les opérations CRUD
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/session';
import {
  createFeuilleTemps,
  getFeuilleTempsById,
  getFeuillesTemps,
  updateFeuilleTemps,
  deleteFeuilleTemps,
  validateFeuilleTemps,
  rejectFeuilleTemps,
  getProjetTempsStats,
  getMembreTempsStats,
} from '@/lib/services/feuille-temps.service';
import { IFeuilleTemps, StatutFeuilleTemps } from '@/lib/types/feuille-temps.types';
import { logCreate, logUpdate, logDelete } from '@/lib/services/audit.service';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getSession } from '@/lib/auth/session';

/**
 * Vérifie les permissions pour les opérations sur les feuilles de temps
 */
async function checkPermission(permission: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Non authentifié');
  }
  // TODO: Implémenter la vérification des permissions
}

/**
 * Crée une nouvelle feuille de temps
 */
export async function createFeuilleTempsAction(data: {
  membre_id: string;
  projet_id: string;
  tache_id?: string;
  date: Date;
  heures_travaillees: number;
  description?: string;
  statut?: StatutFeuilleTemps;
}) {
  try {
    await checkPermission(PERMISSIONS.FEUILLES_TEMPS_CREATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const feuilleTemps = await createFeuilleTemps(data, userId);

    // Audit
    await logCreate('feuilles_temps', feuilleTemps._id!, { user_id: userId });

    revalidatePath('/feuilles-temps');
    revalidatePath(`/projets/${data.projet_id}`);
    if (data.tache_id) {
      revalidatePath(`/taches/${data.tache_id}`);
    }
    return { success: true, feuilleTemps };
  } catch (error) {
    console.error('Erreur lors de la création de la feuille de temps:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère une feuille de temps par ID
 */
export async function getFeuilleTempsAction(id: string) {
  try {
    await checkPermission(PERMISSIONS.FEUILLES_TEMPS_READ);

    const feuilleTemps = await getFeuilleTempsById(id);
    if (!feuilleTemps) {
      return { success: false, error: 'Feuille de temps non trouvée' };
    }

    return { success: true, feuilleTemps };
  } catch (error) {
    console.error('Erreur lors de la récupération de la feuille de temps:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère la liste des feuilles de temps avec filtres
 */
export async function getFeuillesTempsAction(filters: {
  membre_id?: string;
  projet_id?: string;
  tache_id?: string;
  statut?: StatutFeuilleTemps;
  date_debut?: Date;
  date_fin?: Date;
  page?: number;
  limit?: number;
}) {
  try {
    await checkPermission(PERMISSIONS.FEUILLES_TEMPS_READ);

    const result = await getFeuillesTemps(filters);
    return { success: true, ...result };
  } catch (error) {
    console.error('Erreur lors de la récupération des feuilles de temps:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      feuilles_temps: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
  }
}

/**
 * Met à jour une feuille de temps
 */
export async function updateFeuilleTempsAction(
  id: string,
  updates: Partial<IFeuilleTemps>
) {
  try {
    await checkPermission(PERMISSIONS.FEUILLES_TEMPS_UPDATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const feuilleTemps = await updateFeuilleTemps(id, updates, userId);

    // Audit
    const ancienneFeuille = await getFeuilleTempsById(id, false);
    const changes = Object.keys(updates)
      .filter(key => key !== '_id' && key !== 'createdAt' && key !== 'updatedAt')
      .map(key => ({
        champ: key,
        ancienne_valeur: (ancienneFeuille as any)?.[key],
        nouvelle_valeur: updates[key as keyof IFeuilleTemps],
      }));

    await logUpdate('feuilles_temps', id, changes, { user_id: userId });

    revalidatePath('/feuilles-temps');
    revalidatePath(`/feuilles-temps/${id}`);
    if (feuilleTemps.projet_id) {
      revalidatePath(`/projets/${feuilleTemps.projet_id}`);
    }
    return { success: true, feuilleTemps };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la feuille de temps:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime une feuille de temps
 */
export async function deleteFeuilleTempsAction(id: string) {
  try {
    await checkPermission(PERMISSIONS.FEUILLES_TEMPS_DELETE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const feuilleTemps = await getFeuilleTempsById(id, false);
    if (!feuilleTemps) {
      return { success: false, error: 'Feuille de temps non trouvée' };
    }

    await deleteFeuilleTemps(id);

    // Audit
    await logDelete('feuilles_temps', id, feuilleTemps as any, { user_id: userId });

    revalidatePath('/feuilles-temps');
    if (feuilleTemps.projet_id) {
      revalidatePath(`/projets/${feuilleTemps.projet_id}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression de la feuille de temps:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Valide une feuille de temps
 */
export async function validateFeuilleTempsAction(
  id: string,
  commentaire?: string
) {
  try {
    await checkPermission(PERMISSIONS.FEUILLES_TEMPS_VALIDATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const feuilleTemps = await validateFeuilleTemps(id, userId, commentaire);

    // Audit
    await logUpdate('feuilles_temps', id, [{
      champ: 'statut',
      ancienne_valeur: 'SOUMISE',
      nouvelle_valeur: 'VALIDEE',
    }], { user_id: userId });

    revalidatePath('/feuilles-temps');
    revalidatePath(`/feuilles-temps/${id}`);
    if (feuilleTemps.projet_id) {
      revalidatePath(`/projets/${feuilleTemps.projet_id}`);
    }
    return { success: true, feuilleTemps };
  } catch (error) {
    console.error('Erreur lors de la validation de la feuille de temps:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Rejette une feuille de temps
 */
export async function rejectFeuilleTempsAction(
  id: string,
  commentaire: string
) {
  try {
    await checkPermission(PERMISSIONS.FEUILLES_TEMPS_VALIDATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const feuilleTemps = await rejectFeuilleTemps(id, userId, commentaire);

    // Audit
    await logUpdate('feuilles_temps', id, [{
      champ: 'statut',
      ancienne_valeur: 'SOUMISE',
      nouvelle_valeur: 'REJETEE',
    }], { user_id: userId });

    revalidatePath('/feuilles-temps');
    revalidatePath(`/feuilles-temps/${id}`);
    return { success: true, feuilleTemps };
  } catch (error) {
    console.error('Erreur lors du rejet de la feuille de temps:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les statistiques de temps pour un projet
 */
export async function getProjetTempsStatsAction(
  projetId: string,
  periode?: { debut: Date; fin: Date }
) {
  try {
    await checkPermission(PERMISSIONS.FEUILLES_TEMPS_READ);

    const stats = await getProjetTempsStats(projetId, periode);
    return { success: true, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les statistiques de temps pour un membre
 */
export async function getMembreTempsStatsAction(
  membreId: string,
  periode?: { debut: Date; fin: Date }
) {
  try {
    await checkPermission(PERMISSIONS.FEUILLES_TEMPS_READ);

    const stats = await getMembreTempsStats(membreId, periode);
    return { success: true, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

