/**
 * Server Actions pour la gestion des commentaires
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/session';
import {
  createCommentaire,
  getCommentaireById,
  getCommentaires,
  updateCommentaire,
  deleteCommentaire,
  createReponse,
} from '@/lib/services/commentaire.service';
import { ICommentaire, TypeRessource } from '@/lib/types/commentaire.types';
import { logCreate, logUpdate, logDelete } from '@/lib/services/audit.service';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getSession } from '@/lib/auth/session';

/**
 * Vérifie les permissions
 */
async function checkPermission() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Non authentifié');
  }
}

/**
 * Crée un commentaire
 */
export async function createCommentaireAction(data: {
  ressource_type: TypeRessource;
  ressource_id: string;
  contenu: string;
  reponse_a?: string;
}) {
  try {
    await checkPermission();

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const commentaire = await createCommentaire({
      ...data,
      ressource_id: data.ressource_id,
      reponse_a: data.reponse_a ? data.reponse_a : undefined,
    }, userId);

    // Audit
    await logCreate('commentaires', commentaire._id!, { user_id: userId });

    revalidatePath(`/${data.ressource_type === 'PROJET' ? 'projets' : data.ressource_type === 'TACHE' ? 'taches' : 'feuilles-temps'}/${data.ressource_id}`);
    return { success: true, commentaire };
  } catch (error) {
    console.error('Erreur lors de la création du commentaire:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les commentaires d'une ressource
 */
export async function getCommentairesAction(
  ressourceType: TypeRessource,
  ressourceId: string
) {
  try {
    await checkPermission();

    const commentaires = await getCommentaires(ressourceType, ressourceId);
    return { success: true, commentaires };
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      commentaires: [],
    };
  }
}

/**
 * Met à jour un commentaire
 */
export async function updateCommentaireAction(
  id: string,
  updates: Partial<ICommentaire>
) {
  try {
    await checkPermission();

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const commentaire = await updateCommentaire(id, updates, userId);

    // Audit
    await logUpdate('commentaires', id, [{
      champ: 'contenu',
      ancienne_valeur: '',
      nouvelle_valeur: updates.contenu,
    }], { user_id: userId });

    revalidatePath('/commentaires');
    return { success: true, commentaire };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du commentaire:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime un commentaire
 */
export async function deleteCommentaireAction(id: string) {
  try {
    await checkPermission();

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    await deleteCommentaire(id, userId);

    // Audit
    await logDelete('commentaires', id, {}, { user_id: userId });

    revalidatePath('/commentaires');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Crée une réponse à un commentaire
 */
export async function createReponseAction(
  commentaireParentId: string,
  contenu: string
) {
  try {
    await checkPermission();

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const reponse = await createReponse(commentaireParentId, { contenu }, userId);

    // Audit
    await logCreate('commentaires', reponse._id!, { user_id: userId });

    revalidatePath('/commentaires');
    return { success: true, reponse };
  } catch (error) {
    console.error('Erreur lors de la création de la réponse:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

