/**
 * Service de dashboards personnalisés par rôle
 * Données spécifiques selon le rôle de l'utilisateur
 */

import connectDB from '../db/mongodb';
import { Projet, Tache, FeuilleTemps, Membre } from '../models';
import { Types } from 'mongoose';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, isBefore, differenceInDays } from 'date-fns';
import { RolePrincipal } from '../types/membre.types';

/**
 * Interface pour le dashboard global (Admin/Directeur)
 */
export interface DashboardGlobal {
  kpis: {
    projets_total: number;
    projets_actifs: number;
    projets_en_retard: number;
    taches_total: number;
    taches_terminees: number;
    membres_actifs: number;
    budget_total_alloue: number;
    budget_total_consomme: number;
    budget_utilise_pourcentage: number;
  };
  projets_recents: Array<{
    _id: string;
    nom: string;
    statut: string;
    progression: number;
  }>;
  projets_en_retard: Array<{
    _id: string;
    nom: string;
    retard_jours: number;
  }>;
  membres_surcharge: Array<{
    _id: string;
    nom: string;
    utilisation: number;
  }>;
}

/**
 * Interface pour le dashboard chef de projet
 */
export interface DashboardChefProjet {
  mes_projets: Array<{
    _id: string;
    nom: string;
    statut: string;
    progression: number;
    taches_terminees: number;
    taches_total: number;
    budget_utilise: number;
    jours_restants: number;
    est_en_retard: boolean;
  }>;
  taches_a_valider: number;
  feuilles_temps_a_valider: number;
  alertes: Array<{
    type: 'RETARD' | 'BUDGET' | 'TACHE';
    message: string;
    projet_id?: string;
    tache_id?: string;
  }>;
}

/**
 * Interface pour le dashboard membre
 */
export interface DashboardMembre {
  mes_taches: Array<{
    _id: string;
    titre: string;
    projet: string;
    statut: string;
    priorite: string;
    date_fin_prevue?: Date;
    progression: number;
    est_en_retard: boolean;
  }>;
  mes_projets: Array<{
    _id: string;
    nom: string;
    statut: string;
  }>;
  heures_ce_mois: number;
  heures_semaine: number;
  taches_en_cours: number;
  taches_terminees: number;
  prochaines_echeances: Array<{
    tache_id: string;
    titre: string;
    date_fin_prevue: Date;
    jours_restants: number;
  }>;
}

/**
 * Interface pour le dashboard direction
 */
export interface DashboardDirection {
  vue_globale: {
    projets_actifs: number;
    projets_en_retard: number;
    budget_total_alloue: number;
    budget_total_consomme: number;
    budget_utilise_pourcentage: number;
    heures_travaillees_mois: number;
  };
  projets_prioritaires: Array<{
    _id: string;
    nom: string;
    priorite: string;
    statut: string;
    progression: number;
    budget_utilise: number;
  }>;
  retards_critiques: Array<{
    _id: string;
    nom: string;
    retard_jours: number;
    budget_depasse: boolean;
  }>;
  performance_membres: Array<{
    _id: string;
    nom: string;
    taux_completion: number;
    heures_travaillees: number;
  }>;
}

/**
 * Récupère le dashboard global (Admin/Directeur)
 */
export async function getDashboardGlobal(): Promise<DashboardGlobal> {
  await connectDB();

  const maintenant = new Date();
  const debutMois = startOfMonth(maintenant);

  // KPIs
  const projets_total = await Projet.countDocuments({ est_template: false });
  const projets_actifs = await Projet.countDocuments({
    est_template: false,
    statut: { $in: ['PLANIFICATION', 'EN_COURS', 'EN_PAUSE'] },
  });
  const projets_en_retard = await Projet.countDocuments({
    est_template: false,
    date_fin_prevue: { $lt: maintenant },
    statut: { $ne: 'TERMINE' },
  });
  const taches_total = await Tache.countDocuments();
  const taches_terminees = await Tache.countDocuments({ statut: 'TERMINEE' });
  const membres_actifs = await Membre.countDocuments({ statut: 'ACTIF' });

  const projets = await Projet.find({ est_template: false }).lean();
  const budget_total_alloue = projets.reduce((sum, p) => sum + (p.budget_alloue || 0), 0);
  const budget_total_consomme = projets.reduce((sum, p) => sum + (p.budget_consomme || 0), 0);
  const budget_utilise_pourcentage = budget_total_alloue > 0
    ? (budget_total_consomme / budget_total_alloue) * 100
    : 0;

  // Projets récents
  const projetsRecents = await Projet.find({ est_template: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const projetsRecentsAvecProgression = await Promise.all(
    projetsRecents.map(async (projet) => {
      const taches = await Tache.find({ projet_id: projet._id }).lean();
      const taches_total = taches.length;
      const taches_terminees = taches.filter(t => t.statut === 'TERMINEE').length;
      const progression = taches_total > 0
        ? (taches_terminees / taches_total) * 100
        : 0;

      return {
        _id: projet._id.toString(),
        nom: projet.nom,
        statut: projet.statut,
        progression: Math.round(progression * 100) / 100,
      };
    })
  );

  // Projets en retard
  const projetsEnRetard = await Projet.find({
    est_template: false,
    date_fin_prevue: { $lt: maintenant },
    statut: { $ne: 'TERMINE' },
  })
    .sort({ date_fin_prevue: 1 })
    .limit(5)
    .lean();

  const projetsEnRetardAvecDetails = projetsEnRetard.map(projet => ({
    _id: projet._id.toString(),
    nom: projet.nom,
    retard_jours: differenceInDays(maintenant, projet.date_fin_prevue),
  }));

  // Membres en surcharge
  const membres = await Membre.find({ statut: 'ACTIF' }).lean();
  const membresAvecCharge = await Promise.all(
    membres.map(async (membre) => {
      const taches = await Tache.find({
        assignes: membre._id,
        statut: { $nin: ['TERMINEE', 'ANNULEE'] },
      }).lean();
      const charge = taches.reduce((sum, t) => sum + (t.charge_estimee || 0), 0);
      const disponibilite = membre.disponibilite_hebdomadaire || 0;
      const utilisation = disponibilite > 0 ? (charge / disponibilite) * 100 : 0;

      return {
        _id: membre._id.toString(),
        nom: `${membre.prenom} ${membre.nom}`,
        utilisation: Math.round(utilisation * 100) / 100,
      };
    })
  );

  const membresSurcharge = membresAvecCharge
    .filter(m => m.utilisation > 100)
    .sort((a, b) => b.utilisation - a.utilisation)
    .slice(0, 5);

  return {
    kpis: {
      projets_total,
      projets_actifs,
      projets_en_retard,
      taches_total,
      taches_terminees,
      membres_actifs,
      budget_total_alloue: Math.round(budget_total_alloue * 100) / 100,
      budget_total_consomme: Math.round(budget_total_consomme * 100) / 100,
      budget_utilise_pourcentage: Math.round(budget_utilise_pourcentage * 100) / 100,
    },
    projets_recents: projetsRecentsAvecProgression,
    projets_en_retard: projetsEnRetardAvecDetails,
    membres_surcharge: membresSurcharge,
  };
}

/**
 * Récupère le dashboard chef de projet
 */
export async function getDashboardChefProjet(membreId: string): Promise<DashboardChefProjet> {
  await connectDB();

  const maintenant = new Date();

  // Projets dont l'utilisateur est chef
  const projets = await Projet.find({
    chef_projet: membreId,
    est_template: false,
    statut: { $in: ['PLANIFICATION', 'EN_COURS', 'EN_PAUSE'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const mesProjets = await Promise.all(
    projets.map(async (projet) => {
      const taches = await Tache.find({ projet_id: projet._id }).lean();
      const taches_total = taches.length;
      const taches_terminees = taches.filter(t => t.statut === 'TERMINEE').length;
      const progression = taches_total > 0
        ? (taches_terminees / taches_total) * 100
        : 0;

      const budget_utilise = projet.budget_alloue > 0
        ? ((projet.budget_consomme || 0) / projet.budget_alloue) * 100
        : 0;

      const jours_restants = isAfter(projet.date_fin_prevue, maintenant)
        ? differenceInDays(projet.date_fin_prevue, maintenant)
        : 0;

      const est_en_retard = isBefore(projet.date_fin_prevue, maintenant) &&
        projet.statut !== 'TERMINE';

      return {
        _id: projet._id.toString(),
        nom: projet.nom,
        statut: projet.statut,
        progression: Math.round(progression * 100) / 100,
        taches_terminees,
        taches_total,
        budget_utilise: Math.round(budget_utilise * 100) / 100,
        jours_restants,
        est_en_retard,
      };
    })
  );

  // Feuilles de temps à valider (pour les projets dont il est chef)
  const feuillesTempsAValider = await FeuilleTemps.countDocuments({
    projet_id: { $in: projets.map(p => p._id) },
    statut: 'SOUMISE',
  });

  // Alertes
  const alertes: Array<{
    type: 'RETARD' | 'BUDGET' | 'TACHE';
    message: string;
    projet_id?: string;
    tache_id?: string;
  }> = [];

  for (const projet of projets) {
    // Retard
    if (isBefore(projet.date_fin_prevue, maintenant) && projet.statut !== 'TERMINE') {
      alertes.push({
        type: 'RETARD',
        message: `Le projet "${projet.nom}" est en retard de ${differenceInDays(maintenant, projet.date_fin_prevue)} jours`,
        projet_id: projet._id.toString(),
      });
    }

    // Budget
    const budget_utilise = projet.budget_alloue > 0
      ? ((projet.budget_consomme || 0) / projet.budget_alloue) * 100
      : 0;
    if (budget_utilise > 100) {
      alertes.push({
        type: 'BUDGET',
        message: `Le budget du projet "${projet.nom}" est dépassé`,
        projet_id: projet._id.toString(),
      });
    }

    // Tâches en retard
    const tachesEnRetard = await Tache.countDocuments({
      projet_id: projet._id,
      date_fin_prevue: { $lt: maintenant },
      statut: { $nin: ['TERMINEE', 'ANNULEE'] },
    });
    if (tachesEnRetard > 0) {
      alertes.push({
        type: 'TACHE',
        message: `${tachesEnRetard} tâche(s) en retard dans le projet "${projet.nom}"`,
        projet_id: projet._id.toString(),
      });
    }
  }

  return {
    mes_projets: mesProjets,
    taches_a_valider: 0, // À implémenter si nécessaire
    feuilles_temps_a_valider: feuillesTempsAValider,
    alertes: alertes.slice(0, 10), // Limiter à 10 alertes
  };
}

/**
 * Récupère le dashboard membre
 */
export async function getDashboardMembre(membreId: string): Promise<DashboardMembre> {
  await connectDB();

  const maintenant = new Date();
  const debutSemaine = startOfWeek(maintenant, { weekStartsOn: 1 });
  const finSemaine = endOfWeek(maintenant, { weekStartsOn: 1 });
  const debutMois = startOfMonth(maintenant);
  const finMois = endOfMonth(maintenant);

  // Tâches assignées
  const taches = await Tache.find({ assignes: membreId })
    .populate('projet_id', 'nom')
    .sort({ date_fin_prevue: 1 })
    .lean();

  const mesTaches = taches.map(tache => {
    const est_en_retard = tache.date_fin_prevue &&
      isBefore(tache.date_fin_prevue, maintenant) &&
      tache.statut !== 'TERMINEE' &&
      tache.statut !== 'ANNULEE';

    return {
      _id: tache._id.toString(),
      titre: tache.titre,
      projet: typeof tache.projet_id === 'object' && tache.projet_id
        ? tache.projet_id.nom
        : 'Projet',
      statut: tache.statut,
      priorite: tache.priorite,
      date_fin_prevue: tache.date_fin_prevue,
      progression: tache.progression || 0,
      est_en_retard,
    };
  });

  // Projets assignés
  const projets = await Projet.find({
    membres_assignes: membreId,
    est_template: false,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const mesProjets = projets.map(projet => ({
    _id: projet._id.toString(),
    nom: projet.nom,
    statut: projet.statut,
  }));

  // Heures travaillées
  const feuillesTempsMois = await FeuilleTemps.find({
    membre_id: membreId,
    date: { $gte: debutMois, $lte: finMois },
    statut: 'VALIDEE',
  });
  const heures_ce_mois = feuillesTempsMois.reduce(
    (sum, ft) => sum + ft.heures_travaillees,
    0
  );

  const feuillesTempsSemaine = await FeuilleTemps.find({
    membre_id: membreId,
    date: { $gte: debutSemaine, $lte: finSemaine },
    statut: 'VALIDEE',
  });
  const heures_semaine = feuillesTempsSemaine.reduce(
    (sum, ft) => sum + ft.heures_travaillees,
    0
  );

  // Statistiques tâches
  const taches_en_cours = taches.filter(t =>
    t.statut !== 'TERMINEE' && t.statut !== 'ANNULEE'
  ).length;
  const taches_terminees = taches.filter(t => t.statut === 'TERMINEE').length;

  // Prochaines échéances (7 prochains jours)
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() + 7);

  const prochainesEcheances = taches
    .filter(t =>
      t.date_fin_prevue &&
      isAfter(t.date_fin_prevue, maintenant) &&
      isBefore(t.date_fin_prevue, dateLimite) &&
      t.statut !== 'TERMINEE' &&
      t.statut !== 'ANNULEE'
    )
    .slice(0, 5)
    .map(t => ({
      tache_id: t._id.toString(),
      titre: t.titre,
      date_fin_prevue: t.date_fin_prevue!,
      jours_restants: differenceInDays(t.date_fin_prevue!, maintenant),
    }));

  return {
    mes_taches: mesTaches.slice(0, 10),
    mes_projets: mesProjets,
    heures_ce_mois: Math.round(heures_ce_mois * 100) / 100,
    heures_semaine: Math.round(heures_semaine * 100) / 100,
    taches_en_cours,
    taches_terminees,
    prochaines_echeances: prochainesEcheances,
  };
}

/**
 * Récupère le dashboard direction
 */
export async function getDashboardDirection(): Promise<DashboardDirection> {
  await connectDB();

  const maintenant = new Date();
  const debutMois = startOfMonth(maintenant);

  // Vue globale
  const projets_actifs = await Projet.countDocuments({
    est_template: false,
    statut: { $in: ['PLANIFICATION', 'EN_COURS', 'EN_PAUSE'] },
  });
  const projets_en_retard = await Projet.countDocuments({
    est_template: false,
    date_fin_prevue: { $lt: maintenant },
    statut: { $ne: 'TERMINE' },
  });

  const projets = await Projet.find({ est_template: false }).lean();
  const budget_total_alloue = projets.reduce((sum, p) => sum + (p.budget_alloue || 0), 0);
  const budget_total_consomme = projets.reduce((sum, p) => sum + (p.budget_consomme || 0), 0);
  const budget_utilise_pourcentage = budget_total_alloue > 0
    ? (budget_total_consomme / budget_total_alloue) * 100
    : 0;

  const feuillesTemps = await FeuilleTemps.find({
    date: { $gte: debutMois },
    statut: 'VALIDEE',
  });
  const heures_travaillees_mois = feuillesTemps.reduce(
    (sum, ft) => sum + ft.heures_travaillees,
    0
  );

  // Projets prioritaires (CRITIQUE et ELEVEE)
  const projetsPrioritaires = await Projet.find({
    est_template: false,
    priorite: { $in: ['CRITIQUE', 'ELEVEE'] },
    statut: { $in: ['PLANIFICATION', 'EN_COURS', 'EN_PAUSE'] },
  })
    .sort({ priorite: -1, createdAt: -1 })
    .limit(5)
    .lean();

  const projetsPrioritairesAvecDetails = await Promise.all(
    projetsPrioritaires.map(async (projet) => {
      const taches = await Tache.find({ projet_id: projet._id }).lean();
      const taches_total = taches.length;
      const taches_terminees = taches.filter(t => t.statut === 'TERMINEE').length;
      const progression = taches_total > 0
        ? (taches_terminees / taches_total) * 100
        : 0;

      const budget_utilise = projet.budget_alloue > 0
        ? ((projet.budget_consomme || 0) / projet.budget_alloue) * 100
        : 0;

      return {
        _id: projet._id.toString(),
        nom: projet.nom,
        priorite: projet.priorite,
        statut: projet.statut,
        progression: Math.round(progression * 100) / 100,
        budget_utilise: Math.round(budget_utilise * 100) / 100,
      };
    })
  );

  // Retards critiques
  const retardsCritiques = await Projet.find({
    est_template: false,
    date_fin_prevue: { $lt: maintenant },
    statut: { $ne: 'TERMINE' },
  })
    .sort({ date_fin_prevue: 1 })
    .limit(5)
    .lean();

  const retardsCritiquesAvecDetails = retardsCritiques.map(projet => {
    const budget_depasse = projet.budget_alloue > 0 &&
      (projet.budget_consomme || 0) > projet.budget_alloue;

    return {
      _id: projet._id.toString(),
      nom: projet.nom,
      retard_jours: differenceInDays(maintenant, projet.date_fin_prevue),
      budget_depasse,
    };
  });

  // Performance membres
  const membres = await Membre.find({ statut: 'ACTIF' }).lean();
  const performances = await Promise.all(
    membres.map(async (membre) => {
      const taches = await Tache.find({ assignes: membre._id }).lean();
      const taches_total = taches.length;
      const taches_terminees = taches.filter(t => t.statut === 'TERMINEE').length;
      const taux_completion = taches_total > 0
        ? (taches_terminees / taches_total) * 100
        : 0;

      const feuillesTemps = await FeuilleTemps.find({
        membre_id: membre._id,
        date: { $gte: debutMois },
        statut: 'VALIDEE',
      });
      const heures_travaillees = feuillesTemps.reduce(
        (sum, ft) => sum + ft.heures_travaillees,
        0
      );

      return {
        _id: membre._id.toString(),
        nom: `${membre.prenom} ${membre.nom}`,
        taux_completion: Math.round(taux_completion * 100) / 100,
        heures_travaillees: Math.round(heures_travaillees * 100) / 100,
      };
    })
  );

  const performanceMembres = performances
    .sort((a, b) => b.taux_completion - a.taux_completion)
    .slice(0, 10);

  return {
    vue_globale: {
      projets_actifs,
      projets_en_retard,
      budget_total_alloue: Math.round(budget_total_alloue * 100) / 100,
      budget_total_consomme: Math.round(budget_total_consomme * 100) / 100,
      budget_utilise_pourcentage: Math.round(budget_utilise_pourcentage * 100) / 100,
      heures_travaillees_mois: Math.round(heures_travaillees_mois * 100) / 100,
    },
    projets_prioritaires: projetsPrioritairesAvecDetails,
    retards_critiques: retardsCritiquesAvecDetails,
    performance_membres: performanceMembres,
  };
}

/**
 * Récupère le dashboard approprié selon le rôle
 */
export async function getDashboardByRole(
  membreId: string,
  rolePrincipal: RolePrincipal
): Promise<DashboardGlobal | DashboardChefProjet | DashboardMembre | DashboardDirection> {
  switch (rolePrincipal) {
    case 'ADMIN':
    case 'DIRECTEUR':
      return await getDashboardDirection();
    case 'CHEF_PROJET':
      return await getDashboardChefProjet(membreId);
    case 'MEMBRE':
    case 'OBSERVATEUR':
      return await getDashboardMembre(membreId);
    default:
      return await getDashboardMembre(membreId);
  }
}

