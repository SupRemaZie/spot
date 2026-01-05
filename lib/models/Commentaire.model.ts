/**
 * Modèle Mongoose pour la collection commentaires
 */

import mongoose, { Schema, Model } from 'mongoose';
import { ICommentaire, TypeRessource } from '../types/commentaire.types';

const commentaireSchema = new Schema<ICommentaire>(
  {
    ressource_type: {
      type: String,
      required: [true, 'Le type de ressource est requis'],
      enum: {
        values: ['PROJET', 'TACHE', 'FEUILLE_TEMPS'],
        message: 'Le type de ressource doit être PROJET, TACHE ou FEUILLE_TEMPS',
      },
    },
    ressource_id: {
      type: Schema.Types.ObjectId,
      required: [true, 'L\'ID de la ressource est requis'],
      // Référence dynamique selon ressource_type
    },
    auteur_id: {
      type: Schema.Types.ObjectId,
      ref: 'Membre',
      required: [true, 'L\'auteur est requis'],
    },
    contenu: {
      type: String,
      required: [true, 'Le contenu est requis'],
      trim: true,
      maxlength: [5000, 'Le contenu ne peut pas dépasser 5000 caractères'],
    },
    mentions: [{
      type: Schema.Types.ObjectId,
      ref: 'Membre',
    }],
    est_edite: {
      type: Boolean,
      default: false,
    },
    date_edition: {
      type: Date,
    },
    reponse_a: {
      type: Schema.Types.ObjectId,
      ref: 'Commentaire',
    },
  },
  {
    timestamps: true,
    collection: 'commentaires',
  }
);

// Index pour optimiser les requêtes
commentaireSchema.index({ ressource_type: 1, ressource_id: 1 });
commentaireSchema.index({ auteur_id: 1 });
commentaireSchema.index({ mentions: 1 });
commentaireSchema.index({ reponse_a: 1 });
commentaireSchema.index({ createdAt: -1 }); // Pour trier par date décroissante

// Index composé pour récupérer les commentaires d'une ressource
commentaireSchema.index({ ressource_type: 1, ressource_id: 1, createdAt: -1 });

// Hook pre-save pour mettre à jour la date d'édition
commentaireSchema.pre('save', function(next) {
  if (this.isModified('contenu') && !this.isNew) {
    this.est_edite = true;
    this.date_edition = new Date();
  }
  next();
});

// Export du modèle
export const Commentaire: Model<ICommentaire> = 
  mongoose.models.Commentaire || mongoose.model<ICommentaire>('Commentaire', commentaireSchema);

