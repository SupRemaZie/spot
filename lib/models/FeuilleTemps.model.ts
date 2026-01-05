/**
 * Modèle Mongoose pour la collection feuilles_temps
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IFeuilleTemps, StatutFeuilleTemps } from '../types/feuille-temps.types';

const feuilleTempsSchema = new Schema<IFeuilleTemps>(
  {
    membre_id: {
      type: Schema.Types.ObjectId,
      ref: 'Membre',
      required: [true, 'Le membre est requis'],
    },
    projet_id: {
      type: Schema.Types.ObjectId,
      ref: 'Projet',
      required: [true, 'Le projet est requis'],
    },
    tache_id: {
      type: Schema.Types.ObjectId,
      ref: 'Tache',
    },
    date: {
      type: Date,
      required: [true, 'La date est requise'],
      validate: {
        validator: function(value: Date) {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return value <= today;
        },
        message: 'La date ne peut pas être dans le futur',
      },
    },
    heures_travaillees: {
      type: Number,
      required: [true, 'Le nombre d\'heures travaillées est requis'],
      min: [0.25, 'Le minimum est de 0.25 heure (15 minutes)'],
      max: [24, 'Le maximum est de 24 heures par jour'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
    },
    statut: {
      type: String,
      required: [true, 'Le statut est requis'],
      enum: {
        values: ['BROUILLON', 'SOUMISE', 'VALIDEE', 'REJETEE'],
        message: 'Le statut doit être BROUILLON, SOUMISE, VALIDEE ou REJETEE',
      },
      default: 'BROUILLON',
    },
    valide_par: {
      type: Schema.Types.ObjectId,
      ref: 'Membre',
    },
    valide_le: {
      type: Date,
    },
    commentaire_validation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères'],
    },
  },
  {
    timestamps: true,
    collection: 'feuilles_temps',
  }
);

// Index pour optimiser les requêtes
feuilleTempsSchema.index({ membre_id: 1 });
feuilleTempsSchema.index({ projet_id: 1 });
feuilleTempsSchema.index({ tache_id: 1 });
feuilleTempsSchema.index({ date: 1 });
feuilleTempsSchema.index({ statut: 1 });
feuilleTempsSchema.index({ valide_par: 1 });

// Index composés pour les requêtes fréquentes
feuilleTempsSchema.index({ membre_id: 1, date: 1 });
feuilleTempsSchema.index({ membre_id: 1, statut: 1 });
feuilleTempsSchema.index({ projet_id: 1, date: 1 });
feuilleTempsSchema.index({ membre_id: 1, projet_id: 1, date: 1 }, { unique: true }); // Une seule feuille par membre/projet/jour

// Hook pre-save pour valider les dates de validation
feuilleTempsSchema.pre('save', function(next) {
  if (this.statut === 'VALIDEE' || this.statut === 'REJETEE') {
    if (!this.valide_par) {
      return next(new Error('Un validateur est requis pour valider ou rejeter une feuille de temps'));
    }
    if (!this.valide_le) {
      this.valide_le = new Date();
    }
  }
  next();
});

// Export du modèle
export const FeuilleTemps: Model<IFeuilleTemps> = 
  mongoose.models.FeuilleTemps || mongoose.model<IFeuilleTemps>('FeuilleTemps', feuilleTempsSchema);

