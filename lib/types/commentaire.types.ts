/**
 * Types TypeScript pour la collection commentaires
 */

import { ObjectId } from './common.types';

/**
 * Type de ressource commentée
 */
export type TypeRessource = 
  | 'PROJET'
  | 'TACHE'
  | 'FEUILLE_TEMPS';

/**
 * Interface Commentaire (basée sur la collection commentaires)
 */
export interface ICommentaire {
  _id?: ObjectId;
  ressource_type: TypeRessource;
  ressource_id: ObjectId; // ID de la ressource commentée
  auteur_id: ObjectId; // Référence vers membres
  contenu: string;
  mentions?: ObjectId[]; // Références vers membres mentionnés
  est_edite?: boolean;
  date_edition?: Date;
  reponse_a?: ObjectId; // Référence vers commentaires (pour les réponses)
  createdAt?: Date;
  updatedAt?: Date;
}

