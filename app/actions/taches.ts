/**
 * Server Actions pour la gestion des tâches
 * Actions côté serveur pour les opérations CRUD
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth/session';
import {
  createTache,
  getTacheById,
  getTaches,
  getSousTaches,
  updateTache,
  deleteTache,
  addPieceJointe,
  deletePieceJointe,
  updateProgression,
  getTacheStats,
  canStartTache,
} from '@/lib/services/tache.service';
import { ITache, StatutTache, PrioriteTache, IPieceJointe } from '@/lib/types/tache.types';
import { logCreate, logUpdate, logDelete } from '@/lib/services/audit.service';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getSession } from '@/lib/auth/session';

/**
 * Vérifie les permissions pour les opérations sur les tâches
 */
async function checkPermission(permission: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Non authentifié');
  }
  // TODO: Implémenter la vérification des permissions
}

/**
 * Crée une nouvelle tâche
 */
export async function createTacheAction(data: {
  titre: string;
  description?: string;
  projet_id: string;
  tache_parent_id?: string;
  statut: StatutTache;
  priorite: PrioriteTache;
  assignes?: string[];
  charge_estimee?: number;
  date_debut_prevue?: Date;
  date_fin_prevue?: Date;
  dependances?: string[];
  tags?: string[];
}) {
  try {
    await checkPermission(PERMISSIONS.TACHES_CREATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const tache = await createTache(data, userId);

    // Audit
    await logCreate('taches', tache._id!, { user_id: userId });

    revalidatePath('/taches');
    revalidatePath(`/projets/${data.projet_id}`);
    return { success: true, tache };
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère une tâche par ID
 */
export async function getTacheAction(id: string) {
  try {
    await checkPermission(PERMISSIONS.TACHES_READ);

    const tache = await getTacheById(id);
    if (!tache) {
      return { success: false, error: 'Tâche non trouvée' };
    }

    return { success: true, tache };
  } catch (error) {
    console.error('Erreur lors de la récupération de la tâche:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère la liste des tâches avec filtres
 */
export async function getTachesAction(filters: {
  projet_id?: string;
  tache_parent_id?: string | null;
  statut?: StatutTache;
  priorite?: PrioriteTache;
  assigne?: string;
  tags?: string[];
  recherche?: string;
  page?: number;
  limit?: number;
}) {
  try {
    await checkPermission(PERMISSIONS.TACHES_READ);

    const result = await getTaches(filters);
    return { success: true, ...result };
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      taches: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
  }
}

/**
 * Récupère les sous-tâches d'une tâche
 */
export async function getSousTachesAction(tacheParentId: string) {
  try {
    await checkPermission(PERMISSIONS.TACHES_READ);

    const sousTaches = await getSousTaches(tacheParentId);
    return { success: true, sousTaches };
  } catch (error) {
    console.error('Erreur lors de la récupération des sous-tâches:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      sousTaches: [],
    };
  }
}

/**
 * Met à jour une tâche
 */
export async function updateTacheAction(
  id: string,
  updates: Partial<ITache>
) {
  try {
    await checkPermission(PERMISSIONS.TACHES_UPDATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const tache = await updateTache(id, updates, userId);

    // Audit
    const ancienneTache = await getTacheById(id, false);
    const changes = Object.keys(updates)
      .filter(key => key !== '_id' && key !== 'createdAt' && key !== 'updatedAt')
      .map(key => ({
        champ: key,
        ancienne_valeur: (ancienneTache as any)?.[key],
        nouvelle_valeur: updates[key as keyof ITache],
      }));

    await logUpdate('taches', id, changes, { user_id: userId });

    revalidatePath('/taches');
    revalidatePath(`/taches/${id}`);
    if (tache.projet_id) {
      revalidatePath(`/projets/${tache.projet_id}`);
    }
    return { success: true, tache };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime une tâche
 */
export async function deleteTacheAction(id: string) {
  try {
    await checkPermission(PERMISSIONS.TACHES_DELETE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const tache = await getTacheById(id, false);
    if (!tache) {
      return { success: false, error: 'Tâche non trouvée' };
    }

    await deleteTache(id);

    // Audit
    await logDelete('taches', id, tache as any, { user_id: userId });

    revalidatePath('/taches');
    if (tache.projet_id) {
      revalidatePath(`/projets/${tache.projet_id}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Ajoute une pièce jointe
 */
export async function addPieceJointeAction(
  tacheId: string,
  pieceJointe: IPieceJointe
) {
  try {
    await checkPermission(PERMISSIONS.TACHES_UPDATE);

    const tache = await addPieceJointe(tacheId, pieceJointe);

    revalidatePath(`/taches/${tacheId}`);
    return { success: true, tache };
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la pièce jointe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime une pièce jointe
 */
export async function deletePieceJointeAction(
  tacheId: string,
  pieceJointeNom: string
) {
  try {
    await checkPermission(PERMISSIONS.TACHES_UPDATE);

    const tache = await deletePieceJointe(tacheId, pieceJointeNom);

    revalidatePath(`/taches/${tacheId}`);
    return { success: true, tache };
  } catch (error) {
    console.error('Erreur lors de la suppression de la pièce jointe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Met à jour la progression d'une tâche
 */
export async function updateProgressionAction(
  tacheId: string,
  progression: number
) {
  try {
    await checkPermission(PERMISSIONS.TACHES_UPDATE);

    const tache = await updateProgression(tacheId, progression);

    revalidatePath(`/taches/${tacheId}`);
    return { success: true, tache };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les statistiques d'une tâche
 */
export async function getTacheStatsAction(tacheId: string) {
  try {
    await checkPermission(PERMISSIONS.TACHES_READ);

    const stats = await getTacheStats(tacheId);
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
 * Vérifie si une tâche peut être démarrée
 */
export async function canStartTacheAction(tacheId: string) {
  try {
    await checkPermission(PERMISSIONS.TACHES_READ);

    const result = await canStartTache(tacheId);
    return { success: true, ...result };
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

