/**
 * Service métier pour la gestion des tâches
 * Logique métier centralisée pour les opérations CRUD et avancées
 */

import connectDB from '../db/mongodb';
import { Tache, Projet } from '../models';
import { ITache, StatutTache, PrioriteTache, IPieceJointe } from '../types/tache.types';
import { Types } from 'mongoose';
import { HistoriqueModification } from '../types/common.types';

/**
 * Crée une nouvelle tâche
 */
export async function createTache(
  data: Omit<ITache, '_id' | 'createdAt' | 'updatedAt' | 'historique_modifications'>,
  userId: string
): Promise<ITache> {
  await connectDB();

  // Vérifier que le projet existe
  const projet = await Projet.findById(data.projet_id);
  if (!projet) {
    throw new Error('Projet non trouvé');
  }

  // Si c'est une sous-tâche, vérifier que la tâche parent existe et n'est pas elle-même une sous-tâche
  if (data.tache_parent_id) {
    const parent = await Tache.findById(data.tache_parent_id);
    if (!parent) {
      throw new Error('Tâche parent non trouvée');
    }
    if (parent.tache_parent_id) {
      throw new Error('La tâche parent ne peut pas être une sous-tâche');
    }
    // Vérifier que la tâche parent appartient au même projet
    if (parent.projet_id.toString() !== data.projet_id.toString()) {
      throw new Error('La sous-tâche doit appartenir au même projet que la tâche parent');
    }
  }

  // Vérifier les dépendances
  if (data.dependances && data.dependances.length > 0) {
    for (const depId of data.dependances) {
      const dep = await Tache.findById(depId);
      if (!dep) {
        throw new Error(`Tâche dépendante non trouvée: ${depId}`);
      }
      if (dep.projet_id.toString() !== data.projet_id.toString()) {
        throw new Error('Les dépendances doivent appartenir au même projet');
      }
      // Vérifier qu'on ne crée pas de dépendance circulaire
      if (dep.dependances?.some(d => d.toString() === data.projet_id?.toString())) {
        throw new Error('Dépendance circulaire détectée');
      }
    }
  }

  const tache = await Tache.create({
    ...data,
    assignes: data.assignes || [],
    dependances: data.dependances || [],
    tags: data.tags || [],
    pieces_jointes: data.pieces_jointes || [],
    progression: data.progression || 0,
  });

  return tache.toObject();
}

/**
 * Récupère une tâche par ID
 */
export async function getTacheById(
  id: string,
  populateRelations: boolean = true
): Promise<ITache | null> {
  await connectDB();

  let query = Tache.findById(id);

  if (populateRelations) {
    query = query
      .populate('projet_id', 'nom code_projet')
      .populate('tache_parent_id', 'titre')
      .populate('assignes', 'nom prenom email')
      .populate('dependances', 'titre statut');
  }

  const tache = await query.exec();
  return tache ? tache.toObject() : null;
}

/**
 * Récupère toutes les tâches avec filtres
 */
export async function getTaches(filters: {
  projet_id?: string;
  tache_parent_id?: string | null; // null pour les tâches principales uniquement
  statut?: StatutTache;
  priorite?: PrioriteTache;
  assigne?: string;
  tags?: string[];
  recherche?: string;
  page?: number;
  limit?: number;
}): Promise<{ taches: ITache[]; total: number; page: number; totalPages: number }> {
  await connectDB();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {};

  if (filters.projet_id) {
    query.projet_id = new Types.ObjectId(filters.projet_id);
  }

  if (filters.tache_parent_id !== undefined) {
    if (filters.tache_parent_id === null) {
      // Tâches principales uniquement (pas de parent)
      query.tache_parent_id = { $exists: false };
    } else {
      query.tache_parent_id = new Types.ObjectId(filters.tache_parent_id);
    }
  }

  if (filters.statut) {
    query.statut = filters.statut;
  }

  if (filters.priorite) {
    query.priorite = filters.priorite;
  }

  if (filters.assigne) {
    query.assignes = new Types.ObjectId(filters.assigne);
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  if (filters.recherche) {
    query.$or = [
      { titre: { $regex: filters.recherche, $options: 'i' } },
      { description: { $regex: filters.recherche, $options: 'i' } },
    ];
  }

  const total = await Tache.countDocuments(query);

  const taches = await Tache.find(query)
    .populate('projet_id', 'nom code_projet')
    .populate('tache_parent_id', 'titre')
    .populate('assignes', 'nom prenom email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    taches: taches as ITache[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Récupère les sous-tâches d'une tâche
 */
export async function getSousTaches(tacheParentId: string): Promise<ITache[]> {
  await connectDB();

  const taches = await Tache.find({ tache_parent_id: tacheParentId })
    .populate('assignes', 'nom prenom email')
    .sort({ createdAt: 1 })
    .lean();

  return taches as ITache[];
}

/**
 * Met à jour une tâche
 */
export async function updateTache(
  id: string,
  updates: Partial<ITache>,
  userId: string
): Promise<ITache> {
  await connectDB();

  const tache = await Tache.findById(id);
  if (!tache) {
    throw new Error('Tâche non trouvée');
  }

  // Vérifier les dépendances si modifiées
  if (updates.dependances) {
    for (const depId of updates.dependances) {
      if (depId.toString() === id) {
        throw new Error('Une tâche ne peut pas dépendre d\'elle-même');
      }
      const dep = await Tache.findById(depId);
      if (!dep) {
        throw new Error(`Tâche dépendante non trouvée: ${depId}`);
      }
      // Vérifier la dépendance circulaire
      if (dep.dependances?.some(d => d.toString() === id)) {
        throw new Error('Dépendance circulaire détectée');
      }
    }
  }

  // Récupérer les valeurs avant modification pour l'historique
  const modifications: HistoriqueModification[] = [];

  for (const [key, newValue] of Object.entries(updates)) {
    if (key === '_id' || key === 'createdAt' || key === 'updatedAt' || key === 'historique_modifications') {
      continue;
    }

    const oldValue = tache.get(key);
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
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
  Object.assign(tache, updates);

  // Mettre à jour la progression selon le statut
  if (updates.statut === 'TERMINEE' && tache.progression !== 100) {
    tache.progression = 100;
  } else if (updates.statut === 'A_FAIRE' && tache.progression !== 0) {
    tache.progression = 0;
  }

  // Ajouter les modifications à l'historique
  if (modifications.length > 0) {
    tache.historique_modifications = [
      ...(tache.historique_modifications || []),
      ...modifications,
    ];
  }

  await tache.save();
  return tache.toObject();
}

/**
 * Supprime une tâche
 */
export async function deleteTache(id: string): Promise<void> {
  await connectDB();

  const tache = await Tache.findById(id);
  if (!tache) {
    throw new Error('Tâche non trouvée');
  }

  // Vérifier s'il y a des sous-tâches
  const sousTaches = await Tache.countDocuments({ tache_parent_id: id });
  if (sousTaches > 0) {
    throw new Error('Impossible de supprimer une tâche qui a des sous-tâches');
  }

  // Vérifier si cette tâche est une dépendance d'une autre
  const dependants = await Tache.countDocuments({ dependances: id });
  if (dependants > 0) {
    throw new Error('Impossible de supprimer une tâche qui est une dépendance d\'une autre tâche');
  }

  await Tache.findByIdAndDelete(id);
}

/**
 * Ajoute une pièce jointe à une tâche
 */
export async function addPieceJointe(
  tacheId: string,
  pieceJointe: IPieceJointe
): Promise<ITache> {
  await connectDB();

  const tache = await Tache.findById(tacheId);
  if (!tache) {
    throw new Error('Tâche non trouvée');
  }

  tache.pieces_jointes = [...(tache.pieces_jointes || []), pieceJointe];
  await tache.save();

  return tache.toObject();
}

/**
 * Supprime une pièce jointe
 */
export async function deletePieceJointe(
  tacheId: string,
  pieceJointeNom: string
): Promise<ITache> {
  await connectDB();

  const tache = await Tache.findById(tacheId);
  if (!tache) {
    throw new Error('Tâche non trouvée');
  }

  tache.pieces_jointes = tache.pieces_jointes?.filter(pj => pj.nom !== pieceJointeNom) || [];
  await tache.save();

  return tache.toObject();
}

/**
 * Met à jour la progression d'une tâche
 */
export async function updateProgression(
  tacheId: string,
  progression: number
): Promise<ITache> {
  await connectDB();

  const tache = await Tache.findById(tacheId);
  if (!tache) {
    throw new Error('Tâche non trouvée');
  }

  tache.progression = Math.max(0, Math.min(100, progression));
  
  // Mettre à jour le statut si nécessaire
  if (tache.progression === 100 && tache.statut !== 'TERMINEE') {
    tache.statut = 'TERMINEE';
  } else if (tache.progression === 0 && tache.statut !== 'A_FAIRE') {
    tache.statut = 'A_FAIRE';
  }

  await tache.save();
  return tache.toObject();
}

/**
 * Récupère les statistiques d'une tâche
 */
export async function getTacheStats(tacheId: string): Promise<{
  sous_taches_total: number;
  sous_taches_terminees: number;
  dependances_total: number;
  dependances_terminees: number;
  progression_globale: number;
  charge_ecart: number; // Différence entre estimée et réelle
}> {
  await connectDB();

  const tache = await Tache.findById(tacheId);
  if (!tache) {
    throw new Error('Tâche non trouvée');
  }

  const sous_taches_total = await Tache.countDocuments({ tache_parent_id: tacheId });
  const sous_taches_terminees = await Tache.countDocuments({
    tache_parent_id: tacheId,
    statut: 'TERMINEE',
  });

  const dependances_total = tache.dependances?.length || 0;
  let dependances_terminees = 0;

  if (dependances_total > 0) {
    const dependances = await Tache.find({
      _id: { $in: tache.dependances },
      statut: 'TERMINEE',
    });
    dependances_terminees = dependances.length;
  }

  // Calcul de la progression globale (tâche + sous-tâches)
  let progression_globale = tache.progression || 0;
  if (sous_taches_total > 0) {
    const sousTaches = await Tache.find({ tache_parent_id: tacheId });
    const progressionSousTaches = sousTaches.reduce((sum, st) => sum + (st.progression || 0), 0);
    const moyenneSousTaches = progressionSousTaches / sous_taches_total;
    progression_globale = (progression_globale + moyenneSousTaches) / 2;
  }

  const charge_ecart = (tache.charge_reelle || 0) - (tache.charge_estimee || 0);

  return {
    sous_taches_total,
    sous_taches_terminees,
    dependances_total,
    dependances_terminees,
    progression_globale: Math.round(progression_globale * 100) / 100,
    charge_ecart: Math.round(charge_ecart * 100) / 100,
  };
}

/**
 * Vérifie si une tâche peut être démarrée (dépendances terminées)
 */
export async function canStartTache(tacheId: string): Promise<{
  canStart: boolean;
  blockingDependencies: ITache[];
}> {
  await connectDB();

  const tache = await Tache.findById(tacheId);
  if (!tache) {
    throw new Error('Tâche non trouvée');
  }

  if (!tache.dependances || tache.dependances.length === 0) {
    return { canStart: true, blockingDependencies: [] };
  }

  const dependances = await Tache.find({
    _id: { $in: tache.dependances },
    statut: { $ne: 'TERMINEE' },
  });

  return {
    canStart: dependances.length === 0,
    blockingDependencies: dependances.map(d => d.toObject()) as ITache[],
  };
}

