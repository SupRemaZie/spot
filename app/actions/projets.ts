/**
 * Server Actions pour la gestion des projets
 * Actions côté serveur pour les opérations CRUD
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth/session';
import {
  createProjet,
  getProjetById,
  getProjets,
  updateProjet,
  deleteProjet,
  archiveProjet,
  duplicateProjet,
  createTemplateFromProjet,
  addJalon,
  updateJalon,
  deleteJalon,
  updateBudgetConsomme,
  getProjetStats,
} from '@/lib/services/projet.service';
import { IProjet, StatutProjet, PrioriteProjet, IJalon } from '@/lib/types/projet.types';
import { logCreate, logUpdate, logDelete } from '@/lib/services/audit.service';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { hasPermission } from '@/lib/rbac/roles';
import { getSession } from '@/lib/auth/session';

/**
 * Vérifie les permissions pour les opérations sur les projets
 */
async function checkPermission(permission: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Non authentifié');
  }

  // TODO: Implémenter la vérification des permissions
  // Pour l'instant, on autorise tous les utilisateurs authentifiés
  // const userPermissions = getUserPermissions(session.user.role_principal, session.user.roles_secondaires);
  // if (!hasPermission(userPermissions, permission)) {
  //   throw new Error('Permissions insuffisantes');
  // }
}

/**
 * Crée un nouveau projet
 */
export async function createProjetAction(data: {
  nom: string;
  description?: string;
  code_projet?: string;
  statut: StatutProjet;
  priorite: PrioriteProjet;
  date_debut_prevue: Date;
  date_fin_prevue: Date;
  budget_alloue: number;
  chef_projet: string;
  membres_assignes?: string[];
  jalons?: IJalon[];
  tags?: string[];
  est_template?: boolean;
}) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_CREATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const projet = await createProjet(data, userId);

    // Audit
    await logCreate('projets', projet._id!, { user_id: userId });

    revalidatePath('/projets');
    return { success: true, projet };
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère un projet par ID
 */
export async function getProjetAction(id: string) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_READ);

    const projet = await getProjetById(id);
    if (!projet) {
      return { success: false, error: 'Projet non trouvé' };
    }

    return { success: true, projet };
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère la liste des projets avec filtres
 */
export async function getProjetsAction(filters: {
  statut?: StatutProjet;
  priorite?: PrioriteProjet;
  chef_projet?: string;
  membre_assigné?: string;
  est_template?: boolean;
  recherche?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_READ);

    const result = await getProjets(filters);
    return { success: true, ...result };
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      projets: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
  }
}

/**
 * Met à jour un projet
 */
export async function updateProjetAction(
  id: string,
  updates: Partial<IProjet>
) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_UPDATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const projet = await updateProjet(id, updates, userId);

    // Audit - récupérer les changements
    const ancienProjet = await getProjetById(id, false);
    const changes = Object.keys(updates)
      .filter(key => key !== '_id' && key !== 'createdAt' && key !== 'updatedAt')
      .map(key => ({
        champ: key,
        ancienne_valeur: (ancienProjet as any)?.[key],
        nouvelle_valeur: updates[key as keyof IProjet],
      }));

    await logUpdate('projets', id, changes, { user_id: userId });

    revalidatePath('/projets');
    revalidatePath(`/projets/${id}`);
    return { success: true, projet };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime un projet
 */
export async function deleteProjetAction(id: string) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_DELETE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const projet = await getProjetById(id, false);
    if (!projet) {
      return { success: false, error: 'Projet non trouvé' };
    }

    await deleteProjet(id);

    // Audit
    await logDelete('projets', id, projet as any, { user_id: userId });

    revalidatePath('/projets');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Archive un projet
 */
export async function archiveProjetAction(id: string) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_UPDATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const projet = await archiveProjet(id, userId);

    revalidatePath('/projets');
    revalidatePath(`/projets/${id}`);
    return { success: true, projet };
  } catch (error) {
    console.error('Erreur lors de l\'archivage du projet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Duplique un projet
 */
export async function duplicateProjetAction(
  sourceId: string,
  nouveauNom: string
) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_CREATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const nouveauProjet = await duplicateProjet(sourceId, nouveauNom, userId);

    // Audit
    await logCreate('projets', nouveauProjet._id!, { user_id: userId });

    revalidatePath('/projets');
    redirect(`/projets/${nouveauProjet._id}`);
  } catch (error) {
    console.error('Erreur lors de la duplication du projet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Crée un template depuis un projet
 */
export async function createTemplateAction(
  projetId: string,
  nomTemplate: string
) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_CREATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const template = await createTemplateFromProjet(projetId, nomTemplate, userId);

    // Audit
    await logCreate('projets', template._id!, { user_id: userId });

    revalidatePath('/projets');
    return { success: true, template };
  } catch (error) {
    console.error('Erreur lors de la création du template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Ajoute un jalon à un projet
 */
export async function addJalonAction(
  projetId: string,
  jalon: Omit<IJalon, 'id'>
) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_UPDATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const projet = await addJalon(projetId, { ...jalon, id: `jalon-${Date.now()}` }, userId);

    revalidatePath(`/projets/${projetId}`);
    return { success: true, projet };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du jalon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Met à jour un jalon
 */
export async function updateJalonAction(
  projetId: string,
  jalonId: string,
  updates: Partial<IJalon>
) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_UPDATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const projet = await updateJalon(projetId, jalonId, updates, userId);

    revalidatePath(`/projets/${projetId}`);
    return { success: true, projet };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du jalon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime un jalon
 */
export async function deleteJalonAction(projetId: string, jalonId: string) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_UPDATE);

    const projet = await deleteJalon(projetId, jalonId);

    revalidatePath(`/projets/${projetId}`);
    return { success: true, projet };
  } catch (error) {
    console.error('Erreur lors de la suppression du jalon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les statistiques d'un projet
 */
export async function getProjetStatsAction(projetId: string) {
  try {
    await checkPermission(PERMISSIONS.PROJETS_READ);

    const stats = await getProjetStats(projetId);
    return { success: true, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
