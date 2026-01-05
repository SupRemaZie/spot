/**
 * Types TypeScript pour la collection projets
 */

import { ObjectId, HistoriqueModification } from './common.types';

/**
 * Statut du projet
 */
export type StatutProjet = 
  | 'PLANIFICATION'
  | 'EN_COURS'
  | 'EN_PAUSE'
  | 'TERMINE'
  | 'ANNULE'
  | 'ARCHIVE';

/**
 * Priorité du projet
 */
export type PrioriteProjet = 
  | 'FAIBLE'
  | 'NORMALE'
  | 'ELEVEE'
  | 'CRITIQUE';

/**
 * Interface Jalon
 */
export interface IJalon {
  id: string;
  nom: string;
  date_prevue: Date;
  date_reelle?: Date;
  description?: string;
  est_atteint?: boolean;
}

/**
 * Interface Projet (basée sur la collection projets)
 */
export interface IProjet {
  _id?: ObjectId;
  nom: string;
  description?: string;
  code_projet?: string; // Code unique du projet
  statut: StatutProjet;
  priorite: PrioriteProjet;
  date_debut_prevue: Date;
  date_debut_reelle?: Date;
  date_fin_prevue: Date;
  date_fin_reelle?: Date;
  budget_alloue: number;
  budget_consomme?: number;
  chef_projet: ObjectId; // Référence vers membres
  membres_assignes?: ObjectId[]; // Références vers membres
  jalons?: IJalon[];
  est_template?: boolean;
  template_source?: ObjectId; // Si créé depuis un template
  tags?: string[];
  historique_modifications?: HistoriqueModification[];
  createdAt?: Date;
  updatedAt?: Date;
}

