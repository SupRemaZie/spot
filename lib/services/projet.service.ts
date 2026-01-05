/**
 * Service métier pour la gestion des projets
 * Logique métier centralisée pour les opérations CRUD et avancées
 */

import connectDB from '../db/mongodb';
import { Projet } from '../models';
import { IProjet, StatutProjet, PrioriteProjet, IJalon } from '../types/projet.types';
import { Types } from 'mongoose';
import { HistoriqueModification } from '../types/common.types';

/**
 * Crée un nouveau projet
 */
export async function createProjet(
  data: Omit<IProjet, '_id' | 'createdAt' | 'updatedAt' | 'historique_modifications'>,
  userId: string
): Promise<IProjet> {
  await connectDB();

  // Générer un code projet si non fourni
  if (!data.code_projet) {
    const count = await Projet.countDocuments();
    data.code_projet = `PROJ-${String(count + 1).padStart(4, '0')}`;
  }

  // Vérifier l'unicité du code
  const existing = await Projet.findOne({ code_projet: data.code_projet });
  if (existing) {
    throw new Error('Un projet avec ce code existe déjà');
  }

  const projet = await Projet.create({
    ...data,
    budget_consomme: data.budget_consomme || 0,
    membres_assignes: data.membres_assignes || [],
    jalons: data.jalons || [],
    tags: data.tags || [],
  });

  return projet.toObject();
}

/**
 * Récupère un projet par ID
 */
export async function getProjetById(
  id: string,
  populateMembers: boolean = true
): Promise<IProjet | null> {
  await connectDB();

  let query = Projet.findById(id);

  if (populateMembers) {
    query = query
      .populate('chef_projet', 'nom prenom email')
      .populate('membres_assignes', 'nom prenom email role_principal');
  }

  const projet = await query.exec();
  return projet ? projet.toObject() : null;
}

/**
 * Récupère tous les projets avec filtres
 */
export async function getProjets(filters: {
  statut?: StatutProjet;
  priorite?: PrioriteProjet;
  chef_projet?: string;
  membre_assigné?: string;
  est_template?: boolean;
  recherche?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}): Promise<{ projets: IProjet[]; total: number; page: number; totalPages: number }> {
  await connectDB();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  // Construction de la requête
  const query: any = {};

  if (filters.statut) {
    query.statut = filters.statut;
  }

  if (filters.priorite) {
    query.priorite = filters.priorite;
  }

  if (filters.chef_projet) {
    query.chef_projet = new Types.ObjectId(filters.chef_projet);
  }

  if (filters.membre_assigné) {
    query.membres_assignes = new Types.ObjectId(filters.membre_assigné);
  }

  if (filters.est_template !== undefined) {
    query.est_template = filters.est_template;
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  if (filters.recherche) {
    query.$or = [
      { nom: { $regex: filters.recherche, $options: 'i' } },
      { description: { $regex: filters.recherche, $options: 'i' } },
      { code_projet: { $regex: filters.recherche, $options: 'i' } },
    ];
  }

  const total = await Projet.countDocuments(query);

  const projets = await Projet.find(query)
    .populate('chef_projet', 'nom prenom email')
    .populate('membres_assignes', 'nom prenom email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    projets: projets as IProjet[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Met à jour un projet
 */
export async function updateProjet(
  id: string,
  updates: Partial<IProjet>,
  userId: string
): Promise<IProjet> {
  await connectDB();

  const projet = await Projet.findById(id);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  // Récupérer les valeurs avant modification pour l'historique
  const anciennesValeurs: Record<string, unknown> = {};
  const modifications: HistoriqueModification[] = [];

  // Vérifier les champs modifiés
  for (const [key, newValue] of Object.entries(updates)) {
    if (key === '_id' || key === 'createdAt' || key === 'updatedAt' || key === 'historique_modifications') {
      continue;
    }

    const oldValue = projet.get(key);
    if (oldValue !== newValue) {
      anciennesValeurs[key] = oldValue;
      
      // Ajouter à l'historique
      modifications.push({
        champ: key,
        ancienne_valeur: oldValue,
        nouvelle_valeur: newValue,
        modifie_par: new Types.ObjectId(userId),
        modifie_le: new Date(),
      });
    }
  }

  // Appliquer les modifications
  Object.assign(projet, updates);

  // Ajouter les modifications à l'historique
  if (modifications.length > 0) {
    projet.historique_modifications = [
      ...(projet.historique_modifications || []),
      ...modifications,
    ];
  }

  await projet.save();
  return projet.toObject();
}

/**
 * Supprime un projet
 */
export async function deleteProjet(id: string): Promise<void> {
  await connectDB();

  const projet = await Projet.findById(id);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  await Projet.findByIdAndDelete(id);
}

/**
 * Archive un projet
 */
export async function archiveProjet(id: string, userId: string): Promise<IProjet> {
  return updateProjet(id, { statut: 'ARCHIVE' }, userId);
}

/**
 * Duplique un projet (création depuis un template ou copie)
 */
export async function duplicateProjet(
  sourceId: string,
  nouveauNom: string,
  userId: string
): Promise<IProjet> {
  await connectDB();

  const sourceProjet = await Projet.findById(sourceId);
  if (!sourceProjet) {
    throw new Error('Projet source non trouvé');
  }

  // Créer un nouveau projet basé sur le source
  const nouveauProjet = await createProjet({
    nom: nouveauNom,
    description: sourceProjet.description,
    statut: 'PLANIFICATION',
    priorite: sourceProjet.priorite,
    date_debut_prevue: new Date(),
    date_fin_prevue: new Date(Date.now() + (sourceProjet.date_fin_prevue.getTime() - sourceProjet.date_debut_prevue.getTime())),
    budget_alloue: sourceProjet.budget_alloue,
    budget_consomme: 0,
    chef_projet: sourceProjet.chef_projet,
    membres_assignes: sourceProjet.membres_assignes || [],
    jalons: sourceProjet.jalons?.map(j => ({ ...j, est_atteint: false })) || [],
    est_template: false,
    template_source: sourceProjet.est_template ? sourceProjet._id : sourceProjet.template_source,
    tags: sourceProjet.tags || [],
  }, userId);

  return nouveauProjet;
}

/**
 * Crée un template depuis un projet
 */
export async function createTemplateFromProjet(
  projetId: string,
  nomTemplate: string,
  userId: string
): Promise<IProjet> {
  await connectDB();

  const projet = await Projet.findById(projetId);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  const template = await createProjet({
    nom: nomTemplate,
    description: projet.description,
    statut: 'PLANIFICATION',
    priorite: projet.priorite,
    date_debut_prevue: new Date(),
    date_fin_prevue: new Date(),
    budget_alloue: projet.budget_alloue,
    budget_consomme: 0,
    chef_projet: projet.chef_projet,
    membres_assignes: projet.membres_assignes || [],
    jalons: projet.jalons || [],
    est_template: true,
    tags: projet.tags || [],
  }, userId);

  return template;
}

/**
 * Ajoute un jalon à un projet
 */
export async function addJalon(
  projetId: string,
  jalon: IJalon,
  userId: string
): Promise<IProjet> {
  await connectDB();

  const projet = await Projet.findById(projetId);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  if (!jalon.id) {
    jalon.id = `jalon-${Date.now()}`;
  }

  projet.jalons = [...(projet.jalons || []), jalon];
  await projet.save();

  return projet.toObject();
}

/**
 * Met à jour un jalon
 */
export async function updateJalon(
  projetId: string,
  jalonId: string,
  updates: Partial<IJalon>,
  userId: string
): Promise<IProjet> {
  await connectDB();

  const projet = await Projet.findById(projetId);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  const jalon = projet.jalons?.find(j => j.id === jalonId);
  if (!jalon) {
    throw new Error('Jalon non trouvé');
  }

  Object.assign(jalon, updates);
  await projet.save();

  return projet.toObject();
}

/**
 * Supprime un jalon
 */
export async function deleteJalon(
  projetId: string,
  jalonId: string
): Promise<IProjet> {
  await connectDB();

  const projet = await Projet.findById(projetId);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  projet.jalons = projet.jalons?.filter(j => j.id !== jalonId) || [];
  await projet.save();

  return projet.toObject();
}

/**
 * Met à jour le budget consommé d'un projet
 */
export async function updateBudgetConsomme(
  projetId: string,
  montant: number
): Promise<IProjet> {
  await connectDB();

  const projet = await Projet.findById(projetId);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  projet.budget_consomme = (projet.budget_consomme || 0) + montant;
  await projet.save();

  return projet.toObject();
}

/**
 * Récupère les statistiques d'un projet
 */
export async function getProjetStats(projetId: string): Promise<{
  budget_utilise_pourcentage: number;
  jours_restants: number;
  jalons_atteints: number;
  jalons_total: number;
  progression_globale: number;
}> {
  await connectDB();

  const projet = await Projet.findById(projetId);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  const budget_utilise_pourcentage = projet.budget_alloue > 0
    ? ((projet.budget_consomme || 0) / projet.budget_alloue) * 100
    : 0;

  const maintenant = new Date();
  const jours_restants = projet.date_fin_prevue > maintenant
    ? Math.ceil((projet.date_fin_prevue.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const jalons_total = projet.jalons?.length || 0;
  const jalons_atteints = projet.jalons?.filter(j => j.est_atteint).length || 0;

  // Calcul de la progression globale (basé sur les jalons)
  const progression_globale = jalons_total > 0
    ? (jalons_atteints / jalons_total) * 100
    : 0;

  return {
    budget_utilise_pourcentage: Math.round(budget_utilise_pourcentage * 100) / 100,
    jours_restants,
    jalons_atteints,
    jalons_total,
    progression_globale: Math.round(progression_globale * 100) / 100,
  };
}
