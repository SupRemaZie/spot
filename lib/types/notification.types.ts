/**
 * Types TypeScript pour la collection notifications
 */

import { ObjectId } from './common.types';

/**
 * Type de notification
 */
export type TypeNotification = 
  | 'ASSIGNATION'
  | 'MENTION'
  | 'MODIFICATION'
  | 'COMMENTAIRE'
  | 'ECHEANCE'
  | 'VALIDATION'
  | 'SYSTEME';

/**
 * Statut de la notification
 */
export type StatutNotification = 
  | 'NON_LUE'
  | 'LUE'
  | 'ARCHIVEE';

/**
 * Canal de notification
 */
export type CanalNotification = 
  | 'APP'
  | 'EMAIL'
  | 'APP_ET_EMAIL';

/**
 * Interface Notification (basée sur la collection notifications)
 */
export interface INotification {
  _id?: ObjectId;
  destinataire_id: ObjectId; // Référence vers membres
  type: TypeNotification;
  titre: string;
  message: string;
  ressource_type?: string; // 'PROJET', 'TACHE', etc.
  ressource_id?: ObjectId; // ID de la ressource concernée
  statut: StatutNotification;
  canal: CanalNotification;
  lu_le?: Date;
  action_url?: string; // URL pour l'action associée
  createdAt?: Date;
  updatedAt?: Date;
}

