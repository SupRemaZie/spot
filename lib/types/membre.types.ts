/**
 * Types TypeScript pour la collection membres
 */

import { ObjectId } from './common.types';

/**
 * Rôles principaux
 */
export type RolePrincipal = 
  | 'ADMIN'
  | 'DIRECTEUR'
  | 'CHEF_PROJET'
  | 'MEMBRE'
  | 'OBSERVATEUR';

/**
 * Rôles secondaires
 */
export type RoleSecondaire = 
  | 'TECHNICAL_LEAD'
  | 'RESPONSABLE_RH'
  | 'COMPTABLE';

/**
 * Statut du membre
 */
export type StatutMembre = 
  | 'ACTIF'
  | 'INACTIF'
  | 'EN_CONGE'
  | 'SUSPENDU';

/**
 * Interface Congé
 */
export interface IConge {
  date_debut: Date;
  date_fin: Date;
  type: 'ANNUEL' | 'MALADIE' | 'MATERNITE' | 'PATERNITE' | 'SANS_SOLDE' | 'AUTRE';
  raison?: string;
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
}

/**
 * Interface Membre (basée sur la collection membres)
 */
export interface IMembre {
  _id?: ObjectId;
  nom: string;
  prenom: string;
  email: string;
  password?: string; // Hash bcrypt, ne pas exposer dans les réponses
  telephone?: string;
  role_principal: RolePrincipal;
  roles_secondaires?: RoleSecondaire[];
  statut: StatutMembre;
  date_embauche: Date;
  date_depart?: Date;
  competences?: string[];
  taux_horaire?: number;
  disponibilite_hebdomadaire?: number; // heures par semaine
  conges?: IConge[]; // Congés planifiés et en cours
  projets_assignes?: ObjectId[]; // Références vers projets
  taches_assignees?: ObjectId[]; // Références vers taches
  createdAt?: Date;
  updatedAt?: Date;
}
