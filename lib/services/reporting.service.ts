/**
 * Service de reporting et KPIs
 * Calculs d'avancement, retards, statistiques globales
 */

import connectDB from '../db/mongodb';
import { Projet, Tache, FeuilleTemps, Membre } from '../models';
import { Types } from 'mongoose';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isAfter, isBefore, differenceInDays } from 'date-fns';

/**
 * Interface pour les KPIs globaux
 */
export interface GlobalKPIs {
  projets_total: number;
  projets_actifs: number;
  projets_termines: number;
  projets_en_retard: number;
  taches_total: number;
  taches_terminees: number;
  taches_en_retard: number;
  membres_actifs: number;
  heures_travaillees_mois: number;
  budget_total_alloue: number;
  budget_total_consomme: number;
  budget_utilise_pourcentage: number;
}

/**
 * Interface pour les statistiques d'avancement
 */
export interface AvancementStats {
  projet_id: string;
  nom_projet: string;
  progression_globale: number; // 0-100
  taches_terminees: number;
  taches_total: number;
  jalons_atteints: number;
  jalons_total: number;
  jours_restants: number;
  est_en_retard: boolean;
  retard_jours: number;
}

/**
 * Interface pour les statistiques de retard
 */
export interface RetardStats {
  projet_id: string;
  nom_projet: string;
  date_fin_prevue: Date;
  date_fin_reelle?: Date;
  retard_jours: number;
  taches_en_retard: number;
  taches_total: number;
  pourcentage_retard: number;
}

/**
 * Récupère les KPIs globaux
 */
export async function getGlobalKPIs(): Promise<GlobalKPIs> {
  await connectDB();

  const maintenant = new Date();
  const debutMois = startOfMonth(maintenant);
  const finMois = endOfMonth(maintenant);

  // Projets
  const projets_total = await Projet.countDocuments({ est_template: false });
  const projets_actifs = await Projet.countDocuments({
    est_template: false,
    statut: { $in: ['PLANIFICATION', 'EN_COURS', 'EN_PAUSE'] },
  });
  const projets_termines = await Projet.countDocuments({
    est_template: false,
    statut: 'TERMINE',
  });

  // Projets en retard (date_fin_prevue < maintenant et statut != TERMINE)
  const projets_en_retard = await Projet.countDocuments({
    est_template: false,
    date_fin_prevue: { $lt: maintenant },
    statut: { $ne: 'TERMINE' },
  });

  // Tâches
  const taches_total = await Tache.countDocuments();
  const taches_terminees = await Tache.countDocuments({ statut: 'TERMINEE' });
  const taches_en_retard = await Tache.countDocuments({
    date_fin_prevue: { $lt: maintenant },
    statut: { $nin: ['TERMINEE', 'ANNULEE'] },
  });

  // Membres
  const membres_actifs = await Membre.countDocuments({ statut: 'ACTIF' });

  // Heures travaillées ce mois
  const feuillesTempsMois = await FeuilleTemps.find({
    date: { $gte: debutMois, $lte: finMois },
    statut: 'VALIDEE',
  });

  const heures_travaillees_mois = feuillesTempsMois.reduce(
    (sum, ft) => sum + ft.heures_travaillees,
    0
  );

  // Budget
  const projets = await Projet.find({ est_template: false }).lean();
  const budget_total_alloue = projets.reduce(
    (sum, p) => sum + (p.budget_alloue || 0),
    0
  );
  const budget_total_consomme = projets.reduce(
    (sum, p) => sum + (p.budget_consomme || 0),
    0
  );
  const budget_utilise_pourcentage = budget_total_alloue > 0
    ? (budget_total_consomme / budget_total_alloue) * 100
    : 0;

  return {
    projets_total,
    projets_actifs,
    projets_termines,
    projets_en_retard,
    taches_total,
    taches_terminees,
    taches_en_retard,
    membres_actifs,
    heures_travaillees_mois: Math.round(heures_travaillees_mois * 100) / 100,
    budget_total_alloue: Math.round(budget_total_alloue * 100) / 100,
    budget_total_consomme: Math.round(budget_total_consomme * 100) / 100,
    budget_utilise_pourcentage: Math.round(budget_utilise_pourcentage * 100) / 100,
  };
}

/**
 * Récupère les statistiques d'avancement pour tous les projets
 */
export async function getAvancementStats(): Promise<AvancementStats[]> {
  await connectDB();

  const maintenant = new Date();
  const projets = await Projet.find({ est_template: false })
    .populate('jalons')
    .lean();

  const stats: AvancementStats[] = [];

  for (const projet of projets) {
    // Tâches du projet
    const taches = await Tache.find({ projet_id: projet._id }).lean();
    const taches_total = taches.length;
    const taches_terminees = taches.filter(t => t.statut === 'TERMINEE').length;

    // Jalons
    const jalons = projet.jalons || [];
    const jalons_total = jalons.length;
    const jalons_atteints = jalons.filter(j => j.est_atteint).length;

    // Calcul de la progression globale
    let progression_globale = 0;
    if (taches_total > 0) {
      const progressionTaches = (taches_terminees / taches_total) * 100;
      const progressionJalons = jalons_total > 0
        ? (jalons_atteints / jalons_total) * 100
        : 0;
      progression_globale = (progressionTaches + progressionJalons) / 2;
    } else if (jalons_total > 0) {
      progression_globale = (jalons_atteints / jalons_total) * 100;
    }

    // Jours restants
    const jours_restants = isAfter(projet.date_fin_prevue, maintenant)
      ? differenceInDays(projet.date_fin_prevue, maintenant)
      : 0;

    // Retard
    const est_en_retard = isBefore(projet.date_fin_prevue, maintenant) &&
      projet.statut !== 'TERMINE';
    const retard_jours = est_en_retard
      ? differenceInDays(maintenant, projet.date_fin_prevue)
      : 0;

    stats.push({
      projet_id: projet._id.toString(),
      nom_projet: projet.nom,
      progression_globale: Math.round(progression_globale * 100) / 100,
      taches_terminees,
      taches_total,
      jalons_atteints,
      jalons_total,
      jours_restants,
      est_en_retard,
      retard_jours,
    });
  }

  return stats.sort((a, b) => b.progression_globale - a.progression_globale);
}

/**
 * Récupère les statistiques de retard pour tous les projets
 */
export async function getRetardStats(): Promise<RetardStats[]> {
  await connectDB();

  const maintenant = new Date();
  const projets = await Projet.find({
    est_template: false,
    date_fin_prevue: { $lt: maintenant },
    statut: { $ne: 'TERMINE' },
  }).lean();

  const stats: RetardStats[] = [];

  for (const projet of projets) {
    const taches = await Tache.find({ projet_id: projet._id }).lean();
    const taches_total = taches.length;
    const taches_en_retard = taches.filter(t => {
      return t.date_fin_prevue &&
        isBefore(t.date_fin_prevue, maintenant) &&
        t.statut !== 'TERMINEE' &&
        t.statut !== 'ANNULEE';
    }).length;

    const retard_jours = differenceInDays(maintenant, projet.date_fin_prevue);
    const pourcentage_retard = taches_total > 0
      ? (taches_en_retard / taches_total) * 100
      : 0;

    stats.push({
      projet_id: projet._id.toString(),
      nom_projet: projet.nom,
      date_fin_prevue: projet.date_fin_prevue,
      date_fin_reelle: projet.date_fin_reelle,
      retard_jours,
      taches_en_retard,
      taches_total,
      pourcentage_retard: Math.round(pourcentage_retard * 100) / 100,
    });
  }

  return stats.sort((a, b) => b.retard_jours - a.retard_jours);
}

/**
 * Récupère les statistiques de temps par période
 */
export async function getTempsStatsPeriode(
  debut: Date,
  fin: Date
): Promise<{
  heures_par_jour: Array<{ date: Date; heures: number }>;
  heures_par_projet: Array<{ projet_id: string; nom: string; heures: number }>;
  heures_par_membre: Array<{ membre_id: string; nom: string; heures: number }>;
}> {
  await connectDB();

  const feuillesTemps = await FeuilleTemps.find({
    date: { $gte: debut, $lte: fin },
    statut: 'VALIDEE',
  })
    .populate('projet_id', 'nom')
    .populate('membre_id', 'nom prenom')
    .lean();

  // Par jour
  const heuresParJour: Record<string, number> = {};
  for (const ft of feuillesTemps) {
    const dateKey = new Date(ft.date).toISOString().split('T')[0];
    heuresParJour[dateKey] = (heuresParJour[dateKey] || 0) + ft.heures_travaillees;
  }

  // Par projet
  const heuresParProjet: Record<string, { nom: string; heures: number }> = {};
  for (const ft of feuillesTemps) {
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
  }

  // Par membre
  const heuresParMembre: Record<string, { nom: string; heures: number }> = {};
  for (const ft of feuillesTemps) {
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
  }

  return {
    heures_par_jour: Object.entries(heuresParJour).map(([date, heures]) => ({
      date: new Date(date),
      heures: Math.round(heures * 100) / 100,
    })).sort((a, b) => a.date.getTime() - b.date.getTime()),
    heures_par_projet: Object.values(heuresParProjet)
      .map(p => ({ ...p, heures: Math.round(p.heures * 100) / 100 }))
      .sort((a, b) => b.heures - a.heures),
    heures_par_membre: Object.values(heuresParMembre)
      .map(m => ({ ...m, heures: Math.round(m.heures * 100) / 100 }))
      .sort((a, b) => b.heures - a.heures),
  };
}

/**
 * Récupère les statistiques de performance des membres
 */
export async function getMembresPerformance(): Promise<Array<{
  membre_id: string;
  nom: string;
  projets_assignes: number;
  taches_assignees: number;
  taches_terminees: number;
  taux_completion: number;
  heures_travaillees: number;
  charge_actuelle: number;
  disponibilite: number;
  utilisation: number;
}>> {
  await connectDB();

  const membres = await Membre.find({ statut: 'ACTIF' }).lean();
  const maintenant = new Date();
  const debutMois = startOfMonth(maintenant);
  const finMois = endOfMonth(maintenant);

  const performances = [];

  for (const membre of membres) {
    const projets_assignes = await Projet.countDocuments({
      membres_assignes: membre._id,
      statut: { $in: ['PLANIFICATION', 'EN_COURS', 'EN_PAUSE'] },
    });

    const taches = await Tache.find({ assignes: membre._id }).lean();
    const taches_assignees = taches.length;
    const taches_terminees = taches.filter(t => t.statut === 'TERMINEE').length;
    const taux_completion = taches_assignees > 0
      ? (taches_terminees / taches_assignees) * 100
      : 0;

    // Heures travaillées ce mois
    const feuillesTemps = await FeuilleTemps.find({
      membre_id: membre._id,
      date: { $gte: debutMois, $lte: finMois },
      statut: 'VALIDEE',
    });
    const heures_travaillees = feuillesTemps.reduce(
      (sum, ft) => sum + ft.heures_travaillees,
      0
    );

    // Charge actuelle
    const tachesActives = await Tache.find({
      assignes: membre._id,
      statut: { $nin: ['TERMINEE', 'ANNULEE'] },
    });
    const charge_actuelle = tachesActives.reduce(
      (sum, t) => sum + (t.charge_estimee || 0),
      0
    );

    const disponibilite = membre.disponibilite_hebdomadaire || 0;
    const utilisation = disponibilite > 0
      ? (charge_actuelle / disponibilite) * 100
      : 0;

    performances.push({
      membre_id: membre._id.toString(),
      nom: `${membre.prenom} ${membre.nom}`,
      projets_assignes,
      taches_assignees,
      taches_terminees,
      taux_completion: Math.round(taux_completion * 100) / 100,
      heures_travaillees: Math.round(heures_travaillees * 100) / 100,
      charge_actuelle: Math.round(charge_actuelle * 100) / 100,
      disponibilite,
      utilisation: Math.round(utilisation * 100) / 100,
    });
  }

  return performances.sort((a, b) => b.taux_completion - a.taux_completion);
}

/**
 * Récupère les statistiques de budget par projet
 */
export async function getBudgetStats(): Promise<Array<{
  projet_id: string;
  nom_projet: string;
  budget_alloue: number;
  budget_consomme: number;
  budget_restant: number;
  pourcentage_utilise: number;
  est_depasse: boolean;
}>> {
  await connectDB();

  const projets = await Projet.find({ est_template: false }).lean();

  return projets.map(projet => {
    const budget_alloue = projet.budget_alloue || 0;
    const budget_consomme = projet.budget_consomme || 0;
    const budget_restant = budget_alloue - budget_consomme;
    const pourcentage_utilise = budget_alloue > 0
      ? (budget_consomme / budget_alloue) * 100
      : 0;
    const est_depasse = budget_consomme > budget_alloue;

    return {
      projet_id: projet._id.toString(),
      nom_projet: projet.nom,
      budget_alloue: Math.round(budget_alloue * 100) / 100,
      budget_consomme: Math.round(budget_consomme * 100) / 100,
      budget_restant: Math.round(budget_restant * 100) / 100,
      pourcentage_utilise: Math.round(pourcentage_utilise * 100) / 100,
      est_depasse,
    };
  }).sort((a, b) => b.pourcentage_utilise - a.pourcentage_utilise);
}

