/**
 * Modèle Mongoose pour la collection projets
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IProjet, StatutProjet, PrioriteProjet, IJalon } from '../types/projet.types';
import { HistoriqueModification } from '../types/common.types';

// Schéma pour les jalons
const jalonSchema = new Schema<IJalon>({
  id: {
    type: String,
    required: true,
  },
  nom: {
    type: String,
    required: [true, 'Le nom du jalon est requis'],
    trim: true,
  },
  date_prevue: {
    type: Date,
    required: [true, 'La date prévue du jalon est requise'],
  },
  date_reelle: {
    type: Date,
  },
  description: {
    type: String,
    trim: true,
  },
  est_atteint: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

// Schéma pour l'historique des modifications
const historiqueModificationSchema = new Schema<HistoriqueModification>({
  champ: {
    type: String,
    required: true,
  },
  ancienne_valeur: {
    type: Schema.Types.Mixed,
  },
  nouvelle_valeur: {
    type: Schema.Types.Mixed,
  },
  modifie_par: {
    type: Schema.Types.ObjectId,
    ref: 'Membre',
    required: true,
  },
  modifie_le: {
    type: Date,
    default: Date.now,
  },
  raison: {
    type: String,
    trim: true,
  },
}, { _id: false });

const projetSchema = new Schema<IProjet>(
  {
    nom: {
      type: String,
      required: [true, 'Le nom du projet est requis'],
      trim: true,
      maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères'],
    },
    code_projet: {
      type: String,
      unique: true, // Crée automatiquement un index unique
      sparse: true, // Permet plusieurs null
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9-_]+$/, 'Le code projet ne peut contenir que des lettres majuscules, chiffres, tirets et underscores'],
    },
    statut: {
      type: String,
      required: [true, 'Le statut est requis'],
      enum: {
        values: ['PLANIFICATION', 'EN_COURS', 'EN_PAUSE', 'TERMINE', 'ANNULE', 'ARCHIVE'],
        message: 'Le statut doit être PLANIFICATION, EN_COURS, EN_PAUSE, TERMINE, ANNULE ou ARCHIVE',
      },
      default: 'PLANIFICATION',
    },
    priorite: {
      type: String,
      required: [true, 'La priorité est requise'],
      enum: {
        values: ['FAIBLE', 'NORMALE', 'ELEVEE', 'CRITIQUE'],
        message: 'La priorité doit être FAIBLE, NORMALE, ELEVEE ou CRITIQUE',
      },
      default: 'NORMALE',
    },
    date_debut_prevue: {
      type: Date,
      required: [true, 'La date de début prévue est requise'],
    },
    date_debut_reelle: {
      type: Date,
    },
    date_fin_prevue: {
      type: Date,
      required: [true, 'La date de fin prévue est requise'],
      validate: {
        validator: function(this: IProjet, value: Date) {
          return value >= this.date_debut_prevue;
        },
        message: 'La date de fin prévue doit être postérieure à la date de début prévue',
      },
    },
    date_fin_reelle: {
      type: Date,
      validate: {
        validator: function(this: IProjet, value: Date) {
          return !value || value >= (this.date_debut_reelle || this.date_debut_prevue);
        },
        message: 'La date de fin réelle doit être postérieure à la date de début',
      },
    },
    budget_alloue: {
      type: Number,
      required: [true, 'Le budget alloué est requis'],
      min: [0, 'Le budget alloué ne peut pas être négatif'],
    },
    budget_consomme: {
      type: Number,
      default: 0,
      min: [0, 'Le budget consommé ne peut pas être négatif'],
    },
    chef_projet: {
      type: Schema.Types.ObjectId,
      ref: 'Membre',
      required: [true, 'Le chef de projet est requis'],
    },
    membres_assignes: [{
      type: Schema.Types.ObjectId,
      ref: 'Membre',
    }],
    jalons: [jalonSchema],
    est_template: {
      type: Boolean,
      default: false,
    },
    template_source: {
      type: Schema.Types.ObjectId,
      ref: 'Projet',
    },
    tags: {
      type: [String],
      default: [],
    },
    historique_modifications: [historiqueModificationSchema],
  },
  {
    timestamps: true,
    collection: 'projets',
  }
);

// Index pour optimiser les requêtes
// Note: l'index unique sur code_projet est déjà créé par la propriété unique: true du schéma
projetSchema.index({ statut: 1 });
projetSchema.index({ priorite: 1 });
projetSchema.index({ chef_projet: 1 });
projetSchema.index({ membres_assignes: 1 });
projetSchema.index({ est_template: 1 });
projetSchema.index({ date_debut_prevue: 1 });
projetSchema.index({ date_fin_prevue: 1 });
projetSchema.index({ tags: 1 });

// Index composés
projetSchema.index({ statut: 1, priorite: 1 });
projetSchema.index({ chef_projet: 1, statut: 1 });

// Hook pre-save pour vérifier le budget
projetSchema.pre('save', function(next) {
  if (this.budget_consomme && this.budget_consomme > this.budget_alloue * 1.1) {
    // Avertissement si budget dépassé de plus de 10%
    console.warn(`⚠️ Budget du projet ${this.nom} dépassé de plus de 10%`);
  }
  next();
});

// Export du modèle
export const Projet: Model<IProjet> = 
  mongoose.models.Projet || mongoose.model<IProjet>('Projet', projetSchema);

