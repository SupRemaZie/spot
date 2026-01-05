/**
 * Types TypeScript communs pour l'application
 */

import { Types } from 'mongoose';

/**
 * Type pour les ObjectId MongoDB
 */
export type ObjectId = Types.ObjectId | string;

/**
 * Type pour les dates MongoDB
 */
export type MongoDate = Date | string;

/**
 * Interface de base pour tous les documents MongoDB
 */
export interface BaseDocument {
  _id: ObjectId;
  createdAt: MongoDate;
  updatedAt: MongoDate;
}

/**
 * Interface pour l'historique des modifications
 */
export interface HistoriqueModification {
  champ: string;
  ancienne_valeur: unknown;
  nouvelle_valeur: unknown;
  modifie_par: ObjectId;
  modifie_le: MongoDate;
  raison?: string;
}

/**
 * Interface pour les métadonnées d'audit
 */
export interface AuditMetadata {
  cree_par?: ObjectId;
  cree_le?: MongoDate;
  modifie_par?: ObjectId;
  modifie_le?: MongoDate;
  supprime_par?: ObjectId;
  supprime_le?: MongoDate;
  est_supprime?: boolean;
}

