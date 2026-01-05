/**
 * Service d'administration
 * Paramétrage, templates, sauvegarde, maintenance
 */

import connectDB from '../db/mongodb';
import { Projet, Tache, FeuilleTemps, Membre, Commentaire, Notification, AuditLog } from '../models';
import { Types } from 'mongoose';
import { format } from 'date-fns';

/**
 * Interface pour les statistiques système
 */
export interface SystemStats {
  projets_total: number;
  projets_actifs: number;
  taches_total: number;
  membres_total: number;
  feuilles_temps_total: number;
  commentaires_total: number;
  notifications_total: number;
  audit_logs_total: number;
  taille_base_mb: number;
  derniere_sauvegarde?: Date;
}

/**
 * Récupère les statistiques système
 */
export async function getSystemStats(): Promise<SystemStats> {
  await connectDB();

  const projets_total = await Projet.countDocuments({ est_template: false });
  const projets_actifs = await Projet.countDocuments({
    est_template: false,
    statut: { $in: ['PLANIFICATION', 'EN_COURS', 'EN_PAUSE'] },
  });
  const taches_total = await Tache.countDocuments();
  const membres_total = await Membre.countDocuments();
  const feuilles_temps_total = await FeuilleTemps.countDocuments();
  const commentaires_total = await Commentaire.countDocuments();
  const notifications_total = await Notification.countDocuments();
  const audit_logs_total = await AuditLog.countDocuments();

  // Estimation de la taille de la base (approximative)
  const stats = await require('mongoose').connection.db.stats();
  const taille_base_mb = stats ? (stats.dataSize / 1024 / 1024) : 0;

  return {
    projets_total,
    projets_actifs,
    taches_total,
    membres_total,
    feuilles_temps_total,
    commentaires_total,
    notifications_total,
    audit_logs_total,
    taille_base_mb: Math.round(taille_base_mb * 100) / 100,
  };
}

/**
 * Crée une sauvegarde complète de la base de données
 */
export async function createBackup(): Promise<{
  date: Date;
  collections: Record<string, number>;
  data: Record<string, any[]>;
}> {
  await connectDB();

  const date = new Date();
  const collections: Record<string, number> = {};
  const data: Record<string, any[]> = {};

  // Projets (sans templates)
  const projets = await Projet.find({ est_template: false }).lean();
  collections.projets = projets.length;
  data.projets = projets;

  // Tâches
  const taches = await Tache.find().lean();
  collections.taches = taches.length;
  data.taches = taches;

  // Membres
  const membres = await Membre.find().lean();
  collections.membres = membres.length;
  data.membres = membres.map(m => {
    const { password, ...membreSansPassword } = m;
    return membreSansPassword;
  });

  // Feuilles de temps
  const feuillesTemps = await FeuilleTemps.find().lean();
  collections.feuilles_temps = feuillesTemps.length;
  data.feuilles_temps = feuillesTemps;

  // Commentaires
  const commentaires = await Commentaire.find().lean();
  collections.commentaires = commentaires.length;
  data.commentaires = commentaires;

  // Notifications (optionnel, peut être exclu)
  const notifications = await Notification.find().lean();
  collections.notifications = notifications.length;
  data.notifications = notifications;

  return {
    date,
    collections,
    data,
  };
}

/**
 * Restaure une sauvegarde
 */
export async function restoreBackup(backup: {
  date: Date;
  collections: Record<string, number>;
  data: Record<string, any[]>;
}, options: {
  remplacer?: boolean;
  collections?: string[];
} = {}): Promise<{
  success: boolean;
  collections_restaurees: string[];
  erreurs: string[];
}> {
  await connectDB();

  const collections_restaurees: string[] = [];
  const erreurs: string[] = [];

  const collectionsToRestore = options.collections || Object.keys(backup.data);

  try {
    for (const collectionName of collectionsToRestore) {
      if (!backup.data[collectionName]) {
        continue;
      }

      const data = backup.data[collectionName];

      if (options.remplacer) {
        // Supprimer les données existantes
        if (collectionName === 'projets') {
          await Projet.deleteMany({ est_template: false });
        } else if (collectionName === 'taches') {
          await Tache.deleteMany({});
        } else if (collectionName === 'membres') {
          await Membre.deleteMany({});
        } else if (collectionName === 'feuilles_temps') {
          await FeuilleTemps.deleteMany({});
        } else if (collectionName === 'commentaires') {
          await Commentaire.deleteMany({});
        } else if (collectionName === 'notifications') {
          await Notification.deleteMany({});
        }
      }

      // Insérer les données
      if (collectionName === 'projets' && data.length > 0) {
        await Projet.insertMany(data);
        collections_restaurees.push(collectionName);
      } else if (collectionName === 'taches' && data.length > 0) {
        await Tache.insertMany(data);
        collections_restaurees.push(collectionName);
      } else if (collectionName === 'membres' && data.length > 0) {
        await Membre.insertMany(data);
        collections_restaurees.push(collectionName);
      } else if (collectionName === 'feuilles_temps' && data.length > 0) {
        await FeuilleTemps.insertMany(data);
        collections_restaurees.push(collectionName);
      } else if (collectionName === 'commentaires' && data.length > 0) {
        await Commentaire.insertMany(data);
        collections_restaurees.push(collectionName);
      } else if (collectionName === 'notifications' && data.length > 0) {
        await Notification.insertMany(data);
        collections_restaurees.push(collectionName);
      }
    }

    return {
      success: true,
      collections_restaurees,
      erreurs,
    };
  } catch (error) {
    return {
      success: false,
      collections_restaurees,
      erreurs: [error instanceof Error ? error.message : 'Erreur inconnue'],
    };
  }
}

/**
 * Nettoie les anciennes données
 */
export async function cleanupOldData(options: {
  notifications_plus_anciennes_jours?: number;
  audit_logs_plus_anciens_jours?: number;
}): Promise<{
  notifications_supprimees: number;
  audit_logs_supprimes: number;
}> {
  await connectDB();

  let notifications_supprimees = 0;
  let audit_logs_supprimes = 0;

  // Nettoyer les notifications anciennes
  if (options.notifications_plus_anciennes_jours) {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - options.notifications_plus_anciennes_jours);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: dateLimite },
      statut: 'ARCHIVEE',
    });
    notifications_supprimees = result.deletedCount || 0;
  }

  // Nettoyer les logs d'audit anciens
  if (options.audit_logs_plus_anciens_jours) {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - options.audit_logs_plus_anciens_jours);
    
    const result = await AuditLog.deleteMany({
      timestamp: { $lt: dateLimite },
    });
    audit_logs_supprimes = result.deletedCount || 0;
  }

  return {
    notifications_supprimees,
    audit_logs_supprimes,
  };
}

/**
 * Duplique un projet comme template
 */
export async function createTemplateFromProjet(projetId: string): Promise<any> {
  await connectDB();

  const projet = await Projet.findById(projetId);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  // Récupérer les tâches du projet
  const taches = await Tache.find({ projet_id: projetId }).lean();

  // Créer le template
  const templateData: any = {
    nom: `${projet.nom} (Template)`,
    description: projet.description,
    statut: 'PLANIFICATION',
    priorite: projet.priorite,
    est_template: true,
    budget_alloue: projet.budget_alloue,
    budget_consomme: 0,
    membres_assignes: [],
    jalons: projet.jalons?.map((j: any) => ({
      ...j,
      est_atteint: false,
    })) || [],
  };

  const template = await Projet.create(templateData);

  // Dupliquer les tâches
  if (taches.length > 0) {
    const tachesDupliquees = taches.map(tache => ({
      ...tache,
      _id: new Types.ObjectId(),
      projet_id: template._id,
      statut: 'A_FAIRE',
      progression: 0,
      charge_reelle: 0,
      assignes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Tache.insertMany(tachesDupliquees);
  }

  return template.toObject();
}

/**
 * Crée un projet à partir d'un template
 */
export async function createProjetFromTemplate(templateId: string, nouveauNom: string): Promise<any> {
  await connectDB();

  const template = await Projet.findById(templateId);
  if (!template || !template.est_template) {
    throw new Error('Template non trouvé');
  }

  // Récupérer les tâches du template
  const taches = await Tache.find({ projet_id: templateId }).lean();

  // Créer le projet
  const projetData: any = {
    nom: nouveauNom,
    description: template.description,
    statut: 'PLANIFICATION',
    priorite: template.priorite,
    est_template: false,
    budget_alloue: template.budget_alloue,
    budget_consomme: 0,
    membres_assignes: [],
    jalons: template.jalons?.map((j: any) => ({
      ...j,
      est_atteint: false,
    })) || [],
  };

  const projet = await Projet.create(projetData);

  // Dupliquer les tâches
  if (taches.length > 0) {
    const tachesDupliquees = taches.map(tache => ({
      ...tache,
      _id: new Types.ObjectId(),
      projet_id: projet._id,
      statut: 'A_FAIRE',
      progression: 0,
      charge_reelle: 0,
      assignes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Tache.insertMany(tachesDupliquees);
  }

  return projet.toObject();
}

/**
 * Liste tous les templates
 */
export async function getTemplates(): Promise<any[]> {
  await connectDB();

  const templates = await Projet.find({ est_template: true })
    .sort({ createdAt: -1 })
    .lean();

  return templates;
}

