/**
 * Service métier pour la gestion des notifications
 * Création automatique et manuelle de notifications
 */

import connectDB from '../db/mongodb';
import { Notification, Membre } from '../models';
import { INotification, TypeNotification, StatutNotification, CanalNotification } from '../types/notification.types';
import { Types } from 'mongoose';

/**
 * Crée une notification
 */
export async function createNotification(
  data: Omit<INotification, '_id' | 'createdAt' | 'updatedAt' | 'lu_le'>
): Promise<INotification> {
  await connectDB();

  // Vérifier que le destinataire existe
  const destinataire = await Membre.findById(data.destinataire_id);
  if (!destinataire) {
    throw new Error('Destinataire non trouvé');
  }

  const notification = await Notification.create({
    ...data,
    statut: data.statut || 'NON_LUE',
    canal: data.canal || 'APP',
  });

  return notification.toObject();
}

/**
 * Crée plusieurs notifications (pour mentions multiples)
 */
export async function createNotifications(
  notifications: Array<Omit<INotification, '_id' | 'createdAt' | 'updatedAt' | 'lu_le'>>
): Promise<INotification[]> {
  await connectDB();

  const created = await Notification.insertMany(
    notifications.map(n => ({
      ...n,
      statut: n.statut || 'NON_LUE',
      canal: n.canal || 'APP',
    }))
  );

  return created.map(n => n.toObject());
}

/**
 * Récupère les notifications d'un membre
 */
export async function getNotifications(
  membreId: string,
  filters: {
    statut?: StatutNotification;
    type?: TypeNotification;
    non_lues_seulement?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ notifications: INotification[]; total: number; page: number; totalPages: number; non_lues: number }> {
  await connectDB();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {
    destinataire_id: membreId,
  };

  if (filters.statut) {
    query.statut = filters.statut;
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.non_lues_seulement) {
    query.statut = 'NON_LUE';
  }

  const total = await Notification.countDocuments(query);
  const non_lues = await Notification.countDocuments({
    destinataire_id: membreId,
    statut: 'NON_LUE',
  });

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    notifications: notifications as INotification[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
    non_lues,
  };
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string): Promise<INotification> {
  await connectDB();

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new Error('Notification non trouvée');
  }

  notification.statut = 'LUE';
  notification.lu_le = new Date();
  await notification.save();

  return notification.toObject();
}

/**
 * Marque toutes les notifications d'un membre comme lues
 */
export async function markAllNotificationsAsRead(membreId: string): Promise<void> {
  await connectDB();

  await Notification.updateMany(
    {
      destinataire_id: membreId,
      statut: 'NON_LUE',
    },
    {
      statut: 'LUE',
      lu_le: new Date(),
    }
  );
}

/**
 * Archive une notification
 */
export async function archiveNotification(notificationId: string): Promise<INotification> {
  await connectDB();

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new Error('Notification non trouvée');
  }

  notification.statut = 'ARCHIVEE';
  await notification.save();

  return notification.toObject();
}

/**
 * Supprime une notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await connectDB();

  await Notification.findByIdAndDelete(notificationId);
}

/**
 * Crée une notification d'assignation
 */
export async function notifyAssignation(
  membreId: string,
  ressourceType: 'PROJET' | 'TACHE',
  ressourceId: string,
  ressourceNom: string
): Promise<INotification> {
  return createNotification({
    destinataire_id: new Types.ObjectId(membreId),
    type: 'ASSIGNATION',
    titre: `Vous avez été assigné à ${ressourceType === 'PROJET' ? 'un projet' : 'une tâche'}`,
    message: `Vous avez été assigné à "${ressourceNom}"`,
    ressource_type: ressourceType,
    ressource_id: new Types.ObjectId(ressourceId),
    action_url: `/${ressourceType === 'PROJET' ? 'projets' : 'taches'}/${ressourceId}`,
    statut: 'NON_LUE',
    canal: 'APP_ET_EMAIL',
  });
}

/**
 * Crée une notification de mention
 */
export async function notifyMention(
  membreId: string,
  auteurNom: string,
  ressourceType: 'PROJET' | 'TACHE' | 'COMMENTAIRE',
  ressourceId: string,
  ressourceNom: string
): Promise<INotification> {
  return createNotification({
    destinataire_id: new Types.ObjectId(membreId),
    type: 'MENTION',
    titre: `${auteurNom} vous a mentionné`,
    message: `${auteurNom} vous a mentionné dans "${ressourceNom}"`,
    ressource_type: ressourceType,
    ressource_id: new Types.ObjectId(ressourceId),
    action_url: `/${ressourceType === 'PROJET' ? 'projets' : ressourceType === 'TACHE' ? 'taches' : 'commentaires'}/${ressourceId}`,
    statut: 'NON_LUE',
    canal: 'APP_ET_EMAIL',
  });
}

/**
 * Crée une notification de modification
 */
export async function notifyModification(
  membreId: string,
  ressourceType: 'PROJET' | 'TACHE',
  ressourceId: string,
  ressourceNom: string,
  champModifie: string
): Promise<INotification> {
  return createNotification({
    destinataire_id: new Types.ObjectId(membreId),
    type: 'MODIFICATION',
    titre: `Modification de ${ressourceType === 'PROJET' ? 'projet' : 'tâche'}`,
    message: `Le champ "${champModifie}" de "${ressourceNom}" a été modifié`,
    ressource_type: ressourceType,
    ressource_id: new Types.ObjectId(ressourceId),
    action_url: `/${ressourceType === 'PROJET' ? 'projets' : 'taches'}/${ressourceId}`,
    statut: 'NON_LUE',
    canal: 'APP',
  });
}

/**
 * Crée une notification d'échéance
 */
export async function notifyEcheance(
  membreId: string,
  ressourceType: 'PROJET' | 'TACHE',
  ressourceId: string,
  ressourceNom: string,
  joursRestants: number
): Promise<INotification> {
  const message = joursRestants === 0
    ? `L'échéance de "${ressourceNom}" est aujourd'hui`
    : joursRestants === 1
    ? `L'échéance de "${ressourceNom}" est demain`
    : `L'échéance de "${ressourceNom}" est dans ${joursRestants} jours`;

  return createNotification({
    destinataire_id: new Types.ObjectId(membreId),
    type: 'ECHEANCE',
    titre: `Échéance proche : ${ressourceNom}`,
    message,
    ressource_type: ressourceType,
    ressource_id: new Types.ObjectId(ressourceId),
    action_url: `/${ressourceType === 'PROJET' ? 'projets' : 'taches'}/${ressourceId}`,
    statut: 'NON_LUE',
    canal: 'APP_ET_EMAIL',
  });
}

/**
 * Crée une notification de validation
 */
export async function notifyValidation(
  membreId: string,
  ressourceType: 'FEUILLE_TEMPS',
  ressourceId: string,
  ressourceNom: string,
  estValidee: boolean
): Promise<INotification> {
  return createNotification({
    destinataire_id: new Types.ObjectId(membreId),
    type: 'VALIDATION',
    titre: estValidee ? 'Feuille de temps validée' : 'Feuille de temps rejetée',
    message: estValidee
      ? `Votre feuille de temps "${ressourceNom}" a été validée`
      : `Votre feuille de temps "${ressourceNom}" a été rejetée`,
    ressource_type: ressourceType,
    ressource_id: new Types.ObjectId(ressourceId),
    action_url: `/feuilles-temps/${ressourceId}`,
    statut: 'NON_LUE',
    canal: 'APP_ET_EMAIL',
  });
}

/**
 * Crée une notification de commentaire
 */
export async function notifyCommentaire(
  membreId: string,
  auteurNom: string,
  ressourceType: 'PROJET' | 'TACHE',
  ressourceId: string,
  ressourceNom: string
): Promise<INotification> {
  return createNotification({
    destinataire_id: new Types.ObjectId(membreId),
    type: 'COMMENTAIRE',
    titre: `Nouveau commentaire sur ${ressourceType === 'PROJET' ? 'le projet' : 'la tâche'}`,
    message: `${auteurNom} a commenté "${ressourceNom}"`,
    ressource_type: ressourceType,
    ressource_id: new Types.ObjectId(ressourceId),
    action_url: `/${ressourceType === 'PROJET' ? 'projets' : 'taches'}/${ressourceId}`,
    statut: 'NON_LUE',
    canal: 'APP',
  });
}

