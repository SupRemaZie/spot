/**
 * Service métier pour la gestion des membres
 * Logique métier centralisée pour les opérations CRUD et avancées
 */

import connectDB from '../db/mongodb';
import { Membre, Tache, Projet, FeuilleTemps } from '../models';
import { IMembre, RolePrincipal, RoleSecondaire, StatutMembre, IConge } from '../types/membre.types';
import { Types } from 'mongoose';
import { startOfWeek, endOfWeek, isWithinInterval, addWeeks } from 'date-fns';

/**
 * Crée un nouveau membre
 */
export async function createMembre(
  data: Omit<IMembre, '_id' | 'createdAt' | 'updatedAt' | 'password'> & { password?: string },
  userId: string
): Promise<IMembre> {
  await connectDB();

  // Vérifier l'unicité de l'email
  const existing = await Membre.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new Error('Un membre avec cet email existe déjà');
  }

  const membre = await Membre.create({
    ...data,
    email: data.email.toLowerCase(),
    roles_secondaires: data.roles_secondaires || [],
    competences: data.competences || [],
    conges: data.conges || [],
    projets_assignes: data.projets_assignes || [],
    taches_assignees: data.taches_assignees || [],
  });

  return membre.toObject();
}

/**
 * Récupère un membre par ID
 */
export async function getMembreById(
  id: string,
  includePassword: boolean = false
): Promise<IMembre | null> {
  await connectDB();

  let query = Membre.findById(id);

  if (includePassword) {
    query = query.select('+password');
  }

  const membre = await query
    .populate('projets_assignes', 'nom code_projet statut')
    .populate('taches_assignees', 'titre statut priorite')
    .exec();

  return membre ? membre.toObject() : null;
}

/**
 * Récupère tous les membres avec filtres
 */
export async function getMembres(filters: {
  role_principal?: RolePrincipal;
  statut?: StatutMembre;
  competences?: string[];
  recherche?: string;
  page?: number;
  limit?: number;
}): Promise<{ membres: IMembre[]; total: number; page: number; totalPages: number }> {
  await connectDB();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {};

  if (filters.role_principal) {
    query.role_principal = filters.role_principal;
  }

  if (filters.statut) {
    query.statut = filters.statut;
  }

  if (filters.competences && filters.competences.length > 0) {
    query.competences = { $in: filters.competences };
  }

  if (filters.recherche) {
    query.$or = [
      { nom: { $regex: filters.recherche, $options: 'i' } },
      { prenom: { $regex: filters.recherche, $options: 'i' } },
      { email: { $regex: filters.recherche, $options: 'i' } },
    ];
  }

  const total = await Membre.countDocuments(query);

  const membres = await Membre.find(query)
    .populate('projets_assignes', 'nom code_projet')
    .sort({ nom: 1, prenom: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    membres: membres as IMembre[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Met à jour un membre
 */
export async function updateMembre(
  id: string,
  updates: Partial<IMembre>,
  userId: string
): Promise<IMembre> {
  await connectDB();

  const membre = await Membre.findById(id);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  // Si l'email est modifié, vérifier l'unicité
  if (updates.email && updates.email !== membre.email) {
    const existing = await Membre.findOne({ email: updates.email.toLowerCase() });
    if (existing) {
      throw new Error('Un membre avec cet email existe déjà');
    }
    updates.email = updates.email.toLowerCase();
  }

  Object.assign(membre, updates);
  await membre.save();

  return membre.toObject();
}

/**
 * Supprime un membre
 */
export async function deleteMembre(id: string): Promise<void> {
  await connectDB();

  const membre = await Membre.findById(id);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  // Vérifier si le membre est assigné à des projets ou tâches
  const projetsCount = await Projet.countDocuments({
    $or: [
      { chef_projet: id },
      { membres_assignes: id },
    ],
  });

  const tachesCount = await Tache.countDocuments({
    assignes: id,
  });

  if (projetsCount > 0 || tachesCount > 0) {
    throw new Error('Impossible de supprimer un membre assigné à des projets ou tâches');
  }

  await Membre.findByIdAndDelete(id);
}

/**
 * Ajoute une compétence à un membre
 */
export async function addCompetence(
  membreId: string,
  competence: string
): Promise<IMembre> {
  await connectDB();

  const membre = await Membre.findById(membreId);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  if (!membre.competences) {
    membre.competences = [];
  }

  if (!membre.competences.includes(competence)) {
    membre.competences.push(competence);
    await membre.save();
  }

  return membre.toObject();
}

/**
 * Supprime une compétence d'un membre
 */
export async function removeCompetence(
  membreId: string,
  competence: string
): Promise<IMembre> {
  await connectDB();

  const membre = await Membre.findById(membreId);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  if (membre.competences) {
    membre.competences = membre.competences.filter(c => c !== competence);
    await membre.save();
  }

  return membre.toObject();
}

/**
 * Ajoute un congé à un membre
 */
export async function addConge(
  membreId: string,
  conge: IConge
): Promise<IMembre> {
  await connectDB();

  const membre = await Membre.findById(membreId);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  // Vérifier les chevauchements
  if (membre.conges) {
    const chevauchement = membre.conges.find(c => {
      return (
        (c.statut === 'PLANIFIE' || c.statut === 'EN_COURS') &&
        (
          (conge.date_debut >= c.date_debut && conge.date_debut <= c.date_fin) ||
          (conge.date_fin >= c.date_debut && conge.date_fin <= c.date_fin) ||
          (conge.date_debut <= c.date_debut && conge.date_fin >= c.date_fin)
        )
      );
    });

    if (chevauchement) {
      throw new Error('Un congé chevauche avec un congé existant');
    }
  }

  if (!membre.conges) {
    membre.conges = [];
  }

  membre.conges.push(conge);
  await membre.save();

  return membre.toObject();
}

/**
 * Met à jour un congé
 */
export async function updateConge(
  membreId: string,
  congeIndex: number,
  updates: Partial<IConge>
): Promise<IMembre> {
  await connectDB();

  const membre = await Membre.findById(membreId);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  if (!membre.conges || !membre.conges[congeIndex]) {
    throw new Error('Congé non trouvé');
  }

  Object.assign(membre.conges[congeIndex], updates);
  await membre.save();

  return membre.toObject();
}

/**
 * Supprime un congé
 */
export async function deleteConge(
  membreId: string,
  congeIndex: number
): Promise<IMembre> {
  await connectDB();

  const membre = await Membre.findById(membreId);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  if (!membre.conges || !membre.conges[congeIndex]) {
    throw new Error('Congé non trouvé');
  }

  membre.conges.splice(congeIndex, 1);
  await membre.save();

  return membre.toObject();
}

/**
 * Calcule la charge de travail actuelle d'un membre
 */
export async function getChargeTravail(
  membreId: string,
  semaine?: Date
): Promise<{
  charge_estimee: number; // heures
  charge_reelle: number; // heures (depuis feuilles de temps)
  disponibilite: number; // heures disponibles
  pourcentage_utilisation: number; // %
  surcharge: boolean;
  sous_utilisation: boolean;
}> {
  await connectDB();

  const membre = await Membre.findById(membreId);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  const dateReference = semaine || new Date();
  const debutSemaine = startOfWeek(dateReference, { weekStartsOn: 1 });
  const finSemaine = endOfWeek(dateReference, { weekStartsOn: 1 });

  // Récupérer toutes les tâches assignées au membre
  const taches = await Tache.find({
    assignes: membreId,
    statut: { $nin: ['TERMINEE', 'ANNULEE'] },
  });

  // Calculer la charge estimée totale
  const charge_estimee = taches.reduce((sum, tache) => {
    return sum + (tache.charge_estimee || 0);
  }, 0);

  // Calculer la charge réelle depuis les feuilles de temps
  const feuillesTemps = await FeuilleTemps.find({
    membre_id: membreId,
    date: {
      $gte: debutSemaine,
      $lte: finSemaine,
    },
    statut: 'VALIDEE',
  });

  const charge_reelle = feuillesTemps.reduce((sum, ft) => {
    return sum + ft.heures_travaillees;
  }, 0);

  // Disponibilité (en tenant compte des congés)
  let disponibilite = membre.disponibilite_hebdomadaire || 0;

  // Vérifier les congés pour cette semaine
  if (membre.conges) {
    const congesEnCours = membre.conges.filter(c => {
      return (
        (c.statut === 'PLANIFIE' || c.statut === 'EN_COURS') &&
        isWithinInterval(dateReference, { start: c.date_debut, end: c.date_fin })
      );
    });

    if (congesEnCours.length > 0) {
      disponibilite = 0; // En congé, pas de disponibilité
    }
  }

  const pourcentage_utilisation = disponibilite > 0
    ? ((charge_estimee / disponibilite) * 100)
    : charge_estimee > 0
    ? 100 // Surcharge si pas de disponibilité mais des tâches
    : 0;

  const surcharge = pourcentage_utilisation > 100;
  const sous_utilisation = pourcentage_utilisation < 50 && charge_estimee > 0;

  return {
    charge_estimee: Math.round(charge_estimee * 100) / 100,
    charge_reelle: Math.round(charge_reelle * 100) / 100,
    disponibilite: Math.round(disponibilite * 100) / 100,
    pourcentage_utilisation: Math.round(pourcentage_utilisation * 100) / 100,
    surcharge,
    sous_utilisation,
  };
}

/**
 * Récupère les statistiques d'un membre
 */
export async function getMembreStats(membreId: string): Promise<{
  projets_actifs: number;
  taches_actives: number;
  taches_terminees: number;
  charge_actuelle: {
    charge_estimee: number;
    charge_reelle: number;
    disponibilite: number;
    pourcentage_utilisation: number;
    surcharge: boolean;
    sous_utilisation: boolean;
  };
  conges_planifies: number;
  conges_en_cours: number;
}> {
  await connectDB();

  const membre = await Membre.findById(membreId);
  if (!membre) {
    throw new Error('Membre non trouvé');
  }

  const projets_actifs = await Projet.countDocuments({
    membres_assignes: membreId,
    statut: { $in: ['PLANIFICATION', 'EN_COURS'] },
  });

  const taches_actives = await Tache.countDocuments({
    assignes: membreId,
    statut: { $nin: ['TERMINEE', 'ANNULEE'] },
  });

  const taches_terminees = await Tache.countDocuments({
    assignes: membreId,
    statut: 'TERMINEE',
  });

  const charge_actuelle = await getChargeTravail(membreId);

  const conges_planifies = membre.conges?.filter(c => c.statut === 'PLANIFIE').length || 0;
  const conges_en_cours = membre.conges?.filter(c => c.statut === 'EN_COURS').length || 0;

  return {
    projets_actifs,
    taches_actives,
    taches_terminees,
    charge_actuelle,
    conges_planifies,
    conges_en_cours,
  };
}

/**
 * Détecte les membres en surcharge
 */
export async function getMembresSurcharge(seuil: number = 100): Promise<{
  membre: IMembre;
  charge: {
    charge_estimee: number;
    disponibilite: number;
    pourcentage_utilisation: number;
  };
}[]> {
  await connectDB();

  const membres = await Membre.find({ statut: 'ACTIF' }).lean();
  const resultats: any[] = [];

  for (const membre of membres) {
    const charge = await getChargeTravail(membre._id.toString());
    if (charge.pourcentage_utilisation > seuil) {
      resultats.push({
        membre: membre as IMembre,
        charge: {
          charge_estimee: charge.charge_estimee,
          disponibilite: charge.disponibilite,
          pourcentage_utilisation: charge.pourcentage_utilisation,
        },
      });
    }
  }

  return resultats.sort((a, b) => b.charge.pourcentage_utilisation - a.charge.pourcentage_utilisation);
}

/**
 * Détecte les membres en sous-utilisation
 */
export async function getMembresSousUtilisation(seuil: number = 50): Promise<{
  membre: IMembre;
  charge: {
    charge_estimee: number;
    disponibilite: number;
    pourcentage_utilisation: number;
  };
}[]> {
  await connectDB();

  const membres = await Membre.find({ statut: 'ACTIF' }).lean();
  const resultats: any[] = [];

  for (const membre of membres) {
    const charge = await getChargeTravail(membre._id.toString());
    if (charge.pourcentage_utilisation < seuil && charge.charge_estimee > 0) {
      resultats.push({
        membre: membre as IMembre,
        charge: {
          charge_estimee: charge.charge_estimee,
          disponibilite: charge.disponibilite,
          pourcentage_utilisation: charge.pourcentage_utilisation,
        },
      });
    }
  }

  return resultats.sort((a, b) => a.charge.pourcentage_utilisation - b.charge.pourcentage_utilisation);
}
