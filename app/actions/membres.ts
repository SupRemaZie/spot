/**
 * Server Actions pour la gestion des membres
 * Actions côté serveur pour les opérations CRUD
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/session';
import {
  createMembre,
  getMembreById,
  getMembres,
  updateMembre,
  deleteMembre,
  addCompetence,
  removeCompetence,
  addConge,
  updateConge,
  deleteConge,
  getChargeTravail,
  getMembreStats,
  getMembresSurcharge,
  getMembresSousUtilisation,
} from '@/lib/services/membre.service';
import { IMembre, RolePrincipal, StatutMembre, IConge } from '@/lib/types/membre.types';
import { logCreate, logUpdate, logDelete } from '@/lib/services/audit.service';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getSession } from '@/lib/auth/session';

/**
 * Vérifie les permissions pour les opérations sur les membres
 */
async function checkPermission(permission: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Non authentifié');
  }
  // TODO: Implémenter la vérification des permissions
}

/**
 * Crée un nouveau membre
 */
export async function createMembreAction(data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
  role_principal: RolePrincipal;
  roles_secondaires?: string[];
  statut: StatutMembre;
  date_embauche: Date;
  competences?: string[];
  taux_horaire?: number;
  disponibilite_hebdomadaire?: number;
}) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_CREATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const membre = await createMembre(data, userId);

    // Audit
    await logCreate('membres', membre._id!, { user_id: userId });

    revalidatePath('/membres');
    return { success: true, membre };
  } catch (error) {
    console.error('Erreur lors de la création du membre:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère un membre par ID
 */
export async function getMembreAction(id: string) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_READ);

    const membre = await getMembreById(id);
    if (!membre) {
      return { success: false, error: 'Membre non trouvé' };
    }

    return { success: true, membre };
  } catch (error) {
    console.error('Erreur lors de la récupération du membre:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère la liste des membres avec filtres
 */
export async function getMembresAction(filters: {
  role_principal?: RolePrincipal;
  statut?: StatutMembre;
  competences?: string[];
  recherche?: string;
  page?: number;
  limit?: number;
}) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_READ);

    const result = await getMembres(filters);
    return { success: true, ...result };
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      membres: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
  }
}

/**
 * Met à jour un membre
 */
export async function updateMembreAction(
  id: string,
  updates: Partial<IMembre>
) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_UPDATE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const membre = await updateMembre(id, updates, userId);

    // Audit
    const ancienMembre = await getMembreById(id);
    const changes = Object.keys(updates)
      .filter(key => key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'password')
      .map(key => ({
        champ: key,
        ancienne_valeur: (ancienMembre as any)?.[key],
        nouvelle_valeur: updates[key as keyof IMembre],
      }));

    await logUpdate('membres', id, changes, { user_id: userId });

    revalidatePath('/membres');
    revalidatePath(`/membres/${id}`);
    return { success: true, membre };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du membre:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime un membre
 */
export async function deleteMembreAction(id: string) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_DELETE);

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const membre = await getMembreById(id);
    if (!membre) {
      return { success: false, error: 'Membre non trouvé' };
    }

    await deleteMembre(id);

    // Audit
    await logDelete('membres', id, membre as any, { user_id: userId });

    revalidatePath('/membres');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression du membre:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Ajoute une compétence
 */
export async function addCompetenceAction(membreId: string, competence: string) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_UPDATE);

    const membre = await addCompetence(membreId, competence);

    revalidatePath(`/membres/${membreId}`);
    return { success: true, membre };
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la compétence:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime une compétence
 */
export async function removeCompetenceAction(membreId: string, competence: string) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_UPDATE);

    const membre = await removeCompetence(membreId, competence);

    revalidatePath(`/membres/${membreId}`);
    return { success: true, membre };
  } catch (error) {
    console.error('Erreur lors de la suppression de la compétence:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Ajoute un congé
 */
export async function addCongeAction(membreId: string, conge: IConge) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_UPDATE);

    const membre = await addConge(membreId, conge);

    revalidatePath(`/membres/${membreId}`);
    return { success: true, membre };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du congé:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Met à jour un congé
 */
export async function updateCongeAction(
  membreId: string,
  congeIndex: number,
  updates: Partial<IConge>
) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_UPDATE);

    const membre = await updateConge(membreId, congeIndex, updates);

    revalidatePath(`/membres/${membreId}`);
    return { success: true, membre };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du congé:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime un congé
 */
export async function deleteCongeAction(membreId: string, congeIndex: number) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_UPDATE);

    const membre = await deleteConge(membreId, congeIndex);

    revalidatePath(`/membres/${membreId}`);
    return { success: true, membre };
  } catch (error) {
    console.error('Erreur lors de la suppression du congé:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère la charge de travail d'un membre
 */
export async function getChargeTravailAction(membreId: string, semaine?: Date) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_READ);

    const charge = await getChargeTravail(membreId, semaine);
    return { success: true, charge };
  } catch (error) {
    console.error('Erreur lors de la récupération de la charge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les statistiques d'un membre
 */
export async function getMembreStatsAction(membreId: string) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_READ);

    const stats = await getMembreStats(membreId);
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
 * Récupère les membres en surcharge
 */
export async function getMembresSurchargeAction(seuil?: number) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_READ);

    const membres = await getMembresSurcharge(seuil);
    return { success: true, membres };
  } catch (error) {
    console.error('Erreur lors de la récupération des membres en surcharge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      membres: [],
    };
  }
}

/**
 * Récupère les membres en sous-utilisation
 */
export async function getMembresSousUtilisationAction(seuil?: number) {
  try {
    await checkPermission(PERMISSIONS.MEMBRES_READ);

    const membres = await getMembresSousUtilisation(seuil);
    return { success: true, membres };
  } catch (error) {
    console.error('Erreur lors de la récupération des membres en sous-utilisation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      membres: [],
    };
  }
}
