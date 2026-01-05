/**
 * Types TypeScript pour la collection feuilles_temps
 */

import { ObjectId } from './common.types';

/**
 * Statut de la feuille de temps
 */
export type StatutFeuilleTemps = 
  | 'BROUILLON'
  | 'SOUMISE'
  | 'VALIDEE'
  | 'REJETEE';

/**
 * Interface Feuille de temps (basée sur la collection feuilles_temps)
 */
export interface IFeuilleTemps {
  _id?: ObjectId;
  membre_id: ObjectId; // Référence vers membres
  projet_id: ObjectId; // Référence vers projets
  tache_id?: ObjectId; // Référence vers taches (optionnel)
  date: Date; // Date de la feuille de temps
  heures_travaillees: number; // Nombre d'heures travaillées
  description?: string; // Description du travail effectué
  statut: StatutFeuilleTemps;
  valide_par?: ObjectId; // Référence vers membres (validateur)
  valide_le?: Date;
  commentaire_validation?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

