/**
 * Service métier pour la gestion des commentaires
 * Gestion des commentaires avec mentions et réponses
 */

import connectDB from '../db/mongodb';
import { Commentaire, Projet, Tache, FeuilleTemps, Membre } from '../models';
import { ICommentaire, TypeRessource } from '../types/commentaire.types';
import { Types } from 'mongoose';
import { createNotifications } from './notification.service';

/**
 * Extrait les mentions (@nom) d'un texte
 */
function extractMentions(contenu: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = contenu.match(mentionRegex);
  if (!matches) return [];
  
  // Retirer le @ et retourner les noms
  return matches.map(m => m.substring(1));
}

/**
 * Crée un nouveau commentaire
 */
export async function createCommentaire(
  data: Omit<ICommentaire, '_id' | 'createdAt' | 'updatedAt' | 'est_edite' | 'date_edition'>,
  auteurId: string
): Promise<ICommentaire> {
  await connectDB();

  // Vérifier que la ressource existe
  let ressourceNom = '';
  if (data.ressource_type === 'PROJET') {
    const projet = await Projet.findById(data.ressource_id);
    if (!projet) {
      throw new Error('Projet non trouvé');
    }
    ressourceNom = projet.nom;
  } else if (data.ressource_type === 'TACHE') {
    const tache = await Tache.findById(data.ressource_id);
    if (!tache) {
      throw new Error('Tâche non trouvée');
    }
    ressourceNom = tache.titre;
  } else if (data.ressource_type === 'FEUILLE_TEMPS') {
    const feuilleTemps = await FeuilleTemps.findById(data.ressource_id);
    if (!feuilleTemps) {
      throw new Error('Feuille de temps non trouvée');
    }
    ressourceNom = `Feuille de temps du ${new Date(feuilleTemps.date).toLocaleDateString('fr-FR')}`;
  }

  // Extraire les mentions du contenu
  const mentionsTextuelles = extractMentions(data.contenu);
  
  // Chercher les membres mentionnés par nom/prénom/email
  const membres = await Membre.find({
    $or: [
      { nom: { $in: mentionsTextuelles } },
      { prenom: { $in: mentionsTextuelles } },
      { email: { $in: mentionsTextuelles } },
    ],
  }).lean();

  const mentionsIds = membres.map(m => m._id);

  const commentaire = await Commentaire.create({
    ...data,
    auteur_id: new Types.ObjectId(auteurId),
    mentions: mentionsIds,
  });

  // Récupérer l'auteur pour les notifications
  const auteur = await Membre.findById(auteurId).lean();
  const auteurNom = auteur ? `${auteur.prenom} ${auteur.nom}` : 'Un utilisateur';

  // Créer des notifications pour les mentions
  if (mentionsIds.length > 0) {
    const notifications = mentionsIds.map(membreId => ({
      destinataire_id: membreId,
      type: 'MENTION' as const,
      titre: `${auteurNom} vous a mentionné`,
      message: `${auteurNom} vous a mentionné dans un commentaire sur "${ressourceNom}"`,
      ressource_type: data.ressource_type,
      ressource_id: data.ressource_id,
      action_url: `/${data.ressource_type === 'PROJET' ? 'projets' : data.ressource_type === 'TACHE' ? 'taches' : 'feuilles-temps'}/${data.ressource_id}`,
      statut: 'NON_LUE' as const,
      canal: 'APP_ET_EMAIL' as const,
    }));

    await createNotifications(notifications);
  }

  // Créer une notification pour les autres participants de la ressource
  // (si c'est un projet, notifier les membres assignés, etc.)
  if (data.ressource_type === 'PROJET') {
    const projet = await Projet.findById(data.ressource_id).populate('membres_assignes').lean();
    if (projet && projet.membres_assignes) {
      const membresAssignes = projet.membres_assignes
        .filter((m: any) => m._id.toString() !== auteurId && !mentionsIds.some(id => id.toString() === m._id.toString()))
        .map((m: any) => m._id);

      if (membresAssignes.length > 0) {
        const notifications = membresAssignes.map(membreId => ({
          destinataire_id: membreId,
          type: 'COMMENTAIRE' as const,
          titre: `Nouveau commentaire sur le projet`,
          message: `${auteurNom} a commenté "${ressourceNom}"`,
          ressource_type: 'PROJET' as const,
          ressource_id: data.ressource_id,
          action_url: `/projets/${data.ressource_id}`,
          statut: 'NON_LUE' as const,
          canal: 'APP' as const,
        }));

        await createNotifications(notifications);
      }
    }
  } else if (data.ressource_type === 'TACHE') {
    const tache = await Tache.findById(data.ressource_id).populate('assignes').lean();
    if (tache && tache.assignes) {
      const membresAssignes = tache.assignes
        .filter((m: any) => m._id.toString() !== auteurId && !mentionsIds.some(id => id.toString() === m._id.toString()))
        .map((m: any) => m._id);

      if (membresAssignes.length > 0) {
        const notifications = membresAssignes.map(membreId => ({
          destinataire_id: membreId,
          type: 'COMMENTAIRE' as const,
          titre: `Nouveau commentaire sur la tâche`,
          message: `${auteurNom} a commenté "${ressourceNom}"`,
          ressource_type: 'TACHE' as const,
          ressource_id: data.ressource_id,
          action_url: `/taches/${data.ressource_id}`,
          statut: 'NON_LUE' as const,
          canal: 'APP' as const,
        }));

        await createNotifications(notifications);
      }
    }
  }

  return commentaire.toObject();
}

/**
 * Récupère un commentaire par ID
 */
export async function getCommentaireById(
  id: string,
  populateRelations: boolean = true
): Promise<ICommentaire | null> {
  await connectDB();

  let query = Commentaire.findById(id);

  if (populateRelations) {
    query = query
      .populate('auteur_id', 'nom prenom email')
      .populate('mentions', 'nom prenom email')
      .populate('reponse_a', 'contenu auteur_id');
  }

  const commentaire = await query.exec();
  return commentaire ? commentaire.toObject() : null;
}

/**
 * Récupère les commentaires d'une ressource
 */
export async function getCommentaires(
  ressourceType: TypeRessource,
  ressourceId: string
): Promise<ICommentaire[]> {
  await connectDB();

  const commentaires = await Commentaire.find({
    ressource_type: ressourceType,
    ressource_id: ressourceId,
  })
    .populate('auteur_id', 'nom prenom email')
    .populate('mentions', 'nom prenom email')
    .populate('reponse_a', 'contenu auteur_id')
    .sort({ createdAt: 1 })
    .lean();

  return commentaires as ICommentaire[];
}

/**
 * Met à jour un commentaire
 */
export async function updateCommentaire(
  id: string,
  updates: Partial<ICommentaire>,
  userId: string
): Promise<ICommentaire> {
  await connectDB();

  const commentaire = await Commentaire.findById(id);
  if (!commentaire) {
    throw new Error('Commentaire non trouvé');
  }

  // Vérifier que l'utilisateur est l'auteur
  if (commentaire.auteur_id.toString() !== userId) {
    throw new Error('Vous n\'êtes pas autorisé à modifier ce commentaire');
  }

  // Si le contenu est modifié, mettre à jour les mentions
  if (updates.contenu) {
    const mentionsTextuelles = extractMentions(updates.contenu);
    const membres = await Membre.find({
      $or: [
        { nom: { $in: mentionsTextuelles } },
        { prenom: { $in: mentionsTextuelles } },
        { email: { $in: mentionsTextuelles } },
      ],
    }).lean();
    updates.mentions = membres.map(m => m._id);
  }

  Object.assign(commentaire, updates);
  commentaire.est_edite = true;
  commentaire.date_edition = new Date();
  await commentaire.save();

  return commentaire.toObject();
}

/**
 * Supprime un commentaire
 */
export async function deleteCommentaire(id: string, userId: string): Promise<void> {
  await connectDB();

  const commentaire = await Commentaire.findById(id);
  if (!commentaire) {
    throw new Error('Commentaire non trouvé');
  }

  // Vérifier que l'utilisateur est l'auteur ou un admin
  const membre = await Membre.findById(userId).lean();
  if (commentaire.auteur_id.toString() !== userId && membre?.role_principal !== 'ADMIN') {
    throw new Error('Vous n\'êtes pas autorisé à supprimer ce commentaire');
  }

  await Commentaire.findByIdAndDelete(id);
}

/**
 * Crée une réponse à un commentaire
 */
export async function createReponse(
  commentaireParentId: string,
  data: Omit<ICommentaire, '_id' | 'createdAt' | 'updatedAt' | 'est_edite' | 'date_edition' | 'ressource_type' | 'ressource_id'>,
  auteurId: string
): Promise<ICommentaire> {
  await connectDB();

  const commentaireParent = await Commentaire.findById(commentaireParentId);
  if (!commentaireParent) {
    throw new Error('Commentaire parent non trouvé');
  }

  return createCommentaire({
    ...data,
    ressource_type: commentaireParent.ressource_type,
    ressource_id: commentaireParent.ressource_id,
    reponse_a: new Types.ObjectId(commentaireParentId),
  }, auteurId);
}

