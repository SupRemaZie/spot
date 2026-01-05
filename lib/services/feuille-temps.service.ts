/**
 * Service métier pour la gestion des feuilles de temps
 * Logique métier centralisée pour les opérations CRUD et avancées
 */

import connectDB from '../db/mongodb';
import { FeuilleTemps, Projet, Tache, Membre } from '../models';
import { IFeuilleTemps, StatutFeuilleTemps } from '../types/feuille-temps.types';
import { Types } from 'mongoose';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Crée une nouvelle feuille de temps
 */
export async function createFeuilleTemps(
  data: Omit<IFeuilleTemps, '_id' | 'createdAt' | 'updatedAt' | 'valide_par' | 'valide_le'>,
  userId: string
): Promise<IFeuilleTemps> {
  await connectDB();

  // Vérifier que le membre existe
  const membre = await Membre.findById(data.membre_id);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  // Vérifier que le projet existe
  const projet = await Projet.findById(data.projet_id);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  // Vérifier que le membre est assigné au projet
  if (!projet.membres_assignes?.some(id => id.toString() === data.membre_id.toString()) &&
      projet.chef_projet.toString() !== data.membre_id.toString()) {
    throw new Error('Le membre n\'est pas assigné à ce projet');
  }

  // Si une tâche est spécifiée, vérifier qu'elle existe et appartient au projet
  if (data.tache_id) {
    const tache = await Tache.findById(data.tache_id);
    if (!tache) {
      throw new Error('Tâche non trouvée');
    }
    if (tache.projet_id.toString() !== data.projet_id.toString()) {
      throw new Error('La tâche n\'appartient pas au projet');
    }
    if (!tache.assignes?.some(id => id.toString() === data.membre_id.toString())) {
      throw new Error('Le membre n\'est pas assigné à cette tâche');
    }
  }

  // Vérifier l'unicité (une seule feuille par membre/projet/jour)
  const dateDebut = new Date(data.date);
  dateDebut.setHours(0, 0, 0, 0);
  const dateFin = new Date(data.date);
  dateFin.setHours(23, 59, 59, 999);
  
  const existing = await FeuilleTemps.findOne({
    membre_id: data.membre_id,
    projet_id: data.projet_id,
    date: {
      $gte: dateDebut,
      $lte: dateFin,
    },
  });

  if (existing) {
    throw new Error('Une feuille de temps existe déjà pour ce membre, projet et date');
  }

  const feuilleTemps = await FeuilleTemps.create({
    ...data,
    statut: data.statut || 'BROUILLON',
  });

  return feuilleTemps.toObject();
}

/**
 * Récupère une feuille de temps par ID
 */
export async function getFeuilleTempsById(
  id: string,
  populateRelations: boolean = true
): Promise<IFeuilleTemps | null> {
  await connectDB();

  let query = FeuilleTemps.findById(id);

  if (populateRelations) {
    query = query
      .populate('membre_id', 'nom prenom email')
      .populate('projet_id', 'nom code_projet')
      .populate('tache_id', 'titre')
      .populate('valide_par', 'nom prenom');
  }

  const feuilleTemps = await query.exec();
  return feuilleTemps ? feuilleTemps.toObject() : null;
}

/**
 * Récupère toutes les feuilles de temps avec filtres
 */
export async function getFeuillesTemps(filters: {
  membre_id?: string;
  projet_id?: string;
  tache_id?: string;
  statut?: StatutFeuilleTemps;
  date_debut?: Date;
  date_fin?: Date;
  page?: number;
  limit?: number;
}): Promise<{ feuilles_temps: IFeuilleTemps[]; total: number; page: number; totalPages: number }> {
  await connectDB();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {};

  if (filters.membre_id) {
    query.membre_id = new Types.ObjectId(filters.membre_id);
  }

  if (filters.projet_id) {
    query.projet_id = new Types.ObjectId(filters.projet_id);
  }

  if (filters.tache_id) {
    query.tache_id = new Types.ObjectId(filters.tache_id);
  }

  if (filters.statut) {
    query.statut = filters.statut;
  }

  if (filters.date_debut || filters.date_fin) {
    query.date = {};
    if (filters.date_debut) {
      query.date.$gte = filters.date_debut;
    }
    if (filters.date_fin) {
      query.date.$lte = filters.date_fin;
    }
  }

  const total = await FeuilleTemps.countDocuments(query);

  const feuilles_temps = await FeuilleTemps.find(query)
    .populate('membre_id', 'nom prenom email')
    .populate('projet_id', 'nom code_projet')
    .populate('tache_id', 'titre')
    .populate('valide_par', 'nom prenom')
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    feuilles_temps: feuilles_temps as IFeuilleTemps[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Met à jour une feuille de temps
 */
export async function updateFeuilleTemps(
  id: string,
  updates: Partial<IFeuilleTemps>,
  userId: string
): Promise<IFeuilleTemps> {
  await connectDB();

  const feuilleTemps = await FeuilleTemps.findById(id);
  if (!feuilleTemps) {
    throw new Error('Feuille de temps non trouvée');
  }

  // Si la feuille est validée, on ne peut pas la modifier
  if (feuilleTemps.statut === 'VALIDEE') {
    throw new Error('Impossible de modifier une feuille de temps validée');
  }

  // Si on change le statut vers VALIDEE ou REJETEE, mettre à jour les dates
  if (updates.statut === 'VALIDEE' || updates.statut === 'REJETEE') {
    updates.valide_par = new Types.ObjectId(userId);
    updates.valide_le = new Date();
  }

  Object.assign(feuilleTemps, updates);
  await feuilleTemps.save();

  // Si la feuille est validée, mettre à jour le budget et la charge
  if (feuilleTemps.statut === 'VALIDEE') {
    await updateBudgetEtCharge(feuilleTemps);
  }

  return feuilleTemps.toObject();
}

/**
 * Valide une feuille de temps
 */
export async function validateFeuilleTemps(
  id: string,
  validateurId: string,
  commentaire?: string
): Promise<IFeuilleTemps> {
  await connectDB();

  const feuilleTemps = await FeuilleTemps.findById(id);
  if (!feuilleTemps) {
    throw new Error('Feuille de temps non trouvée');
  }

  if (feuilleTemps.statut === 'VALIDEE') {
    throw new Error('Cette feuille de temps est déjà validée');
  }

  feuilleTemps.statut = 'VALIDEE';
  feuilleTemps.valide_par = new Types.ObjectId(validateurId);
  feuilleTemps.valide_le = new Date();
  if (commentaire) {
    feuilleTemps.commentaire_validation = commentaire;
  }

  await feuilleTemps.save();

  // Mettre à jour le budget et la charge
  await updateBudgetEtCharge(feuilleTemps);

  return feuilleTemps.toObject();
}

/**
 * Rejette une feuille de temps
 */
export async function rejectFeuilleTemps(
  id: string,
  validateurId: string,
  commentaire: string
): Promise<IFeuilleTemps> {
  await connectDB();

  const feuilleTemps = await FeuilleTemps.findById(id);
  if (!feuilleTemps) {
    throw new Error('Feuille de temps non trouvée');
  }

  if (feuilleTemps.statut === 'VALIDEE') {
    throw new Error('Impossible de rejeter une feuille de temps validée');
  }

  feuilleTemps.statut = 'REJETEE';
  feuilleTemps.valide_par = new Types.ObjectId(validateurId);
  feuilleTemps.valide_le = new Date();
  feuilleTemps.commentaire_validation = commentaire;

  await feuilleTemps.save();

  return feuilleTemps.toObject();
}

/**
 * Supprime une feuille de temps
 */
export async function deleteFeuilleTemps(id: string): Promise<void> {
  await connectDB();

  const feuilleTemps = await FeuilleTemps.findById(id);
  if (!feuilleTemps) {
    throw new Error('Feuille de temps non trouvée');
  }

  // Si la feuille est validée, retirer les heures du budget et de la charge
  if (feuilleTemps.statut === 'VALIDEE') {
    await removeBudgetEtCharge(feuilleTemps);
  }

  await FeuilleTemps.findByIdAndDelete(id);
}

/**
 * Met à jour le budget consommé du projet et la charge réelle de la tâche
 */
async function updateBudgetEtCharge(feuilleTemps: any): Promise<void> {
  // Mettre à jour le budget consommé du projet
  const projet = await Projet.findById(feuilleTemps.projet_id);
  if (projet) {
    const membre = await Membre.findById(feuilleTemps.membre_id);
    if (membre && membre.taux_horaire) {
      const cout = feuilleTemps.heures_travaillees * membre.taux_horaire;
      projet.budget_consomme = (projet.budget_consomme || 0) + cout;
      await projet.save();
    }
  }

  // Mettre à jour la charge réelle de la tâche si spécifiée
  if (feuilleTemps.tache_id) {
    const tache = await Tache.findById(feuilleTemps.tache_id);
    if (tache) {
      tache.charge_reelle = (tache.charge_reelle || 0) + feuilleTemps.heures_travaillees;
      await tache.save();
    }
  }
}

/**
 * Retire les heures du budget et de la charge (lors de la suppression ou rejet)
 */
async function removeBudgetEtCharge(feuilleTemps: any): Promise<void> {
  // Retirer du budget consommé du projet
  const projet = await Projet.findById(feuilleTemps.projet_id);
  if (projet) {
    const membre = await Membre.findById(feuilleTemps.membre_id);
    if (membre && membre.taux_horaire) {
      const cout = feuilleTemps.heures_travaillees * membre.taux_horaire;
      projet.budget_consomme = Math.max(0, (projet.budget_consomme || 0) - cout);
      await projet.save();
    }
  }

  // Retirer de la charge réelle de la tâche si spécifiée
  if (feuilleTemps.tache_id) {
    const tache = await Tache.findById(feuilleTemps.tache_id);
    if (tache) {
      tache.charge_reelle = Math.max(0, (tache.charge_reelle || 0) - feuilleTemps.heures_travaillees);
      await tache.save();
    }
  }
}

/**
 * Récupère les statistiques de temps pour un projet
 */
export async function getProjetTempsStats(projetId: string, periode?: { debut: Date; fin: Date }): Promise<{
  heures_totales: number;
  heures_par_membre: Array<{ membre_id: string; nom: string; heures: number }>;
  heures_par_tache: Array<{ tache_id: string; titre: string; heures: number }>;
  cout_total: number;
  heures_estimees: number;
  ecart: number; // réel - estimé
}> {
  await connectDB();

  const query: any = {
    projet_id: projetId,
    statut: 'VALIDEE',
  };

  if (periode) {
    query.date = {
      $gte: periode.debut,
      $lte: periode.fin,
    };
  }

  const feuillesTemps = await FeuilleTemps.find(query)
    .populate('membre_id', 'nom prenom taux_horaire')
    .populate('tache_id', 'titre charge_estimee')
    .lean();

  let heures_totales = 0;
  let cout_total = 0;
  const heuresParMembre: Record<string, { nom: string; heures: number }> = {};
  const heuresParTache: Record<string, { titre: string; heures: number }> = {};
  let heures_estimees = 0;

  for (const ft of feuillesTemps) {
    heures_totales += ft.heures_travaillees;

    // Par membre
    const membreId = ft.membre_id.toString();
    if (!heuresParMembre[membreId]) {
      heuresParMembre[membreId] = {
        nom: typeof ft.membre_id === 'object' && ft.membre_id
          ? `${ft.membre_id.prenom} ${ft.membre_id.nom}`
          : membreId,
        heures: 0,
      };
    }
    heuresParMembre[membreId].heures += ft.heures_travaillees;

    // Calcul du coût
    if (typeof ft.membre_id === 'object' && ft.membre_id && ft.membre_id.taux_horaire) {
      cout_total += ft.heures_travaillees * ft.membre_id.taux_horaire;
    }

    // Par tâche
    if (ft.tache_id) {
      const tacheId = ft.tache_id.toString();
      if (!heuresParTache[tacheId]) {
        heuresParTache[tacheId] = {
          titre: typeof ft.tache_id === 'object' && ft.tache_id ? ft.tache_id.titre : tacheId,
          heures: 0,
        };
      }
      heuresParTache[tacheId].heures += ft.heures_travaillees;

      // Heures estimées
      if (typeof ft.tache_id === 'object' && ft.tache_id && ft.tache_id.charge_estimee) {
        heures_estimees += ft.tache_id.charge_estimee;
      }
    }
  }

  return {
    heures_totales: Math.round(heures_totales * 100) / 100,
    heures_par_membre: Object.values(heuresParMembre),
    heures_par_tache: Object.values(heuresParTache),
    cout_total: Math.round(cout_total * 100) / 100,
    heures_estimees: Math.round(heures_estimees * 100) / 100,
    ecart: Math.round((heures_totales - heures_estimees) * 100) / 100,
  };
}

/**
 * Récupère les statistiques de temps pour un membre
 */
export async function getMembreTempsStats(membreId: string, periode?: { debut: Date; fin: Date }): Promise<{
  heures_totales: number;
  heures_par_projet: Array<{ projet_id: string; nom: string; heures: number }>;
  heures_par_tache: Array<{ tache_id: string; titre: string; heures: number }>;
  cout_total: number;
}> {
  await connectDB();

  const query: any = {
    membre_id: membreId,
    statut: 'VALIDEE',
  };

  if (periode) {
    query.date = {
      $gte: periode.debut,
      $lte: periode.fin,
    };
  }

  const feuillesTemps = await FeuilleTemps.find(query)
    .populate('projet_id', 'nom code_projet')
    .populate('tache_id', 'titre')
    .lean();

  let heures_totales = 0;
  let cout_total = 0;
  const heuresParProjet: Record<string, { nom: string; heures: number }> = {};
  const heuresParTache: Record<string, { titre: string; heures: number }> = {};

  const membre = await Membre.findById(membreId);
  const tauxHoraire = membre?.taux_horaire || 0;

  for (const ft of feuillesTemps) {
    heures_totales += ft.heures_travaillees;
    cout_total += ft.heures_travaillees * tauxHoraire;

    // Par projet
    const projetId = ft.projet_id.toString();
    if (!heuresParProjet[projetId]) {
      heuresParProjet[projetId] = {
        nom: typeof ft.projet_id === 'object' && ft.projet_id
          ? ft.projet_id.nom
          : projetId,
        heures: 0,
      };
    }
    heuresParProjet[projetId].heures += ft.heures_travaillees;

    // Par tâche
    if (ft.tache_id) {
      const tacheId = ft.tache_id.toString();
      if (!heuresParTache[tacheId]) {
        heuresParTache[tacheId] = {
          titre: typeof ft.tache_id === 'object' && ft.tache_id ? ft.tache_id.titre : tacheId,
          heures: 0,
        };
      }
      heuresParTache[tacheId].heures += ft.heures_travaillees;
    }
  }

  return {
    heures_totales: Math.round(heures_totales * 100) / 100,
    heures_par_projet: Object.values(heuresParProjet),
    heures_par_tache: Object.values(heuresParTache),
    cout_total: Math.round(cout_total * 100) / 100,
  };
}

