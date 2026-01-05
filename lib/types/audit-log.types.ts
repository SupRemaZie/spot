/**
 * Types TypeScript pour la collection audit_logs
 */

import { ObjectId } from './common.types';

/**
 * Type d'action audité
 */
export type ActionAudit = 
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PERMISSION_DENIED'
  | 'EXPORT'
  | 'IMPORT';

/**
 * Collection audité
 */
export type CollectionAudit = 
  | 'projets'
  | 'taches'
  | 'membres'
  | 'feuilles_temps'
  | 'commentaires'
  | 'notifications'
  | 'audit_logs';

/**
 * Interface Audit Log (basée sur la collection audit_logs)
 */
export interface IAuditLog {
  _id?: ObjectId;
  action: ActionAudit;
  collection?: CollectionAudit;
  document_id?: ObjectId; // ID du document concerné
  user_id?: ObjectId; // Référence vers membres (utilisateur ayant effectué l'action)
  ip_address?: string;
  user_agent?: string;
  changes?: {
    champ?: string;
    ancienne_valeur?: unknown;
    nouvelle_valeur?: unknown;
  }[];
  document_snapshot?: Record<string, unknown>; // Snapshot avant suppression
  metadata?: Record<string, unknown>; // Métadonnées supplémentaires
  timestamp: Date;
  createdAt?: Date;
}

