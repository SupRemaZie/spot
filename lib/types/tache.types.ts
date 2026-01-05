/**
 * Types TypeScript pour la collection taches
 */

import { ObjectId, HistoriqueModification } from './common.types';

/**
 * Statut de la tâche
 */
export type StatutTache = 
  | 'A_FAIRE'
  | 'EN_COURS'
  | 'EN_PAUSE'
  | 'EN_REVUE'
  | 'TERMINEE'
  | 'ANNULEE';

/**
 * Priorité de la tâche
 */
export type PrioriteTache = 
  | 'FAIBLE'
  | 'NORMALE'
  | 'ELEVEE'
  | 'CRITIQUE';

/**
 * Interface Pièce jointe
 */
export interface IPieceJointe {
  nom: string;
  url: string;
  type_mime: string;
  taille: number; // en octets
  upload_par: ObjectId;
  upload_le: Date;
}

/**
 * Interface Tâche (basée sur la collection taches)
 */
export interface ITache {
  _id?: ObjectId;
  titre: string;
  description?: string;
  projet_id: ObjectId; // Référence vers projets
  tache_parent_id?: ObjectId; // Pour les sous-tâches (référence vers taches)
  statut: StatutTache;
  priorite: PrioriteTache;
  assignes?: ObjectId[]; // Références vers membres
  charge_estimee?: number; // heures
  charge_reelle?: number; // heures
  date_debut_prevue?: Date;
  date_debut_reelle?: Date;
  date_fin_prevue?: Date;
  date_fin_reelle?: Date;
  progression?: number; // 0-100
  dependances?: ObjectId[]; // Références vers taches (tâches dont celle-ci dépend)
  tags?: string[];
  pieces_jointes?: IPieceJointe[];
  historique_modifications?: HistoriqueModification[];
  createdAt?: Date;
  updatedAt?: Date;
}

