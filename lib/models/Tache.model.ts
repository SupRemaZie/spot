/**
 * Modèle Mongoose pour la collection taches
 */

import mongoose, { Schema, Model } from 'mongoose';
import { ITache, StatutTache, PrioriteTache, IPieceJointe } from '../types/tache.types';
import { HistoriqueModification } from '../types/common.types';

// Schéma pour les pièces jointes
const pieceJointeSchema = new Schema<IPieceJointe>({
  nom: {
    type: String,
    required: [true, 'Le nom de la pièce jointe est requis'],
    trim: true,
  },
  url: {
    type: String,
    required: [true, 'L\'URL de la pièce jointe est requise'],
  },
  type_mime: {
    type: String,
    required: [true, 'Le type MIME est requis'],
  },
  taille: {
    type: Number,
    required: [true, 'La taille est requise'],
    min: [0, 'La taille ne peut pas être négative'],
  },
  upload_par: {
    type: Schema.Types.ObjectId,
    ref: 'Membre',
    required: true,
  },
  upload_le: {
    type: Date,
    default: Date.now,
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

const tacheSchema = new Schema<ITache>(
  {
    titre: {
      type: String,
      required: [true, 'Le titre de la tâche est requis'],
      trim: true,
      maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères'],
    },
    projet_id: {
      type: Schema.Types.ObjectId,
      ref: 'Projet',
      required: [true, 'Le projet est requis'],
    },
    tache_parent_id: {
      type: Schema.Types.ObjectId,
      ref: 'Tache',
      validate: {
        validator: async function(this: ITache, value: mongoose.Types.ObjectId) {
          if (!value) return true;
          // Vérifier que la tâche parent n'est pas elle-même une sous-tâche
          const parent = await mongoose.model('Tache').findById(value);
          return parent && !parent.tache_parent_id;
        },
        message: 'La tâche parent ne peut pas être une sous-tâche',
      },
    },
    statut: {
      type: String,
      required: [true, 'Le statut est requis'],
      enum: {
        values: ['A_FAIRE', 'EN_COURS', 'EN_PAUSE', 'EN_REVUE', 'TERMINEE', 'ANNULEE'],
        message: 'Le statut doit être A_FAIRE, EN_COURS, EN_PAUSE, EN_REVUE, TERMINEE ou ANNULEE',
      },
      default: 'A_FAIRE',
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
    assignes: [{
      type: Schema.Types.ObjectId,
      ref: 'Membre',
    }],
    charge_estimee: {
      type: Number,
      min: [0, 'La charge estimée ne peut pas être négative'],
    },
    charge_reelle: {
      type: Number,
      min: [0, 'La charge réelle ne peut pas être négative'],
    },
    date_debut_prevue: {
      type: Date,
    },
    date_debut_reelle: {
      type: Date,
    },
    date_fin_prevue: {
      type: Date,
      validate: {
        validator: function(this: ITache, value: Date) {
          return !value || !this.date_debut_prevue || value >= this.date_debut_prevue;
        },
        message: 'La date de fin prévue doit être postérieure à la date de début prévue',
      },
    },
    date_fin_reelle: {
      type: Date,
      validate: {
        validator: function(this: ITache, value: Date) {
          return !value || !this.date_debut_reelle || value >= this.date_debut_reelle;
        },
        message: 'La date de fin réelle doit être postérieure à la date de début réelle',
      },
    },
    progression: {
      type: Number,
      min: [0, 'La progression ne peut pas être négative'],
      max: [100, 'La progression ne peut pas dépasser 100'],
      default: 0,
    },
    dependances: [{
      type: Schema.Types.ObjectId,
      ref: 'Tache',
      validate: {
        validator: function(this: ITache, value: mongoose.Types.ObjectId) {
          return value.toString() !== this._id?.toString();
        },
        message: 'Une tâche ne peut pas dépendre d\'elle-même',
      },
    }],
    tags: {
      type: [String],
      default: [],
    },
    pieces_jointes: [pieceJointeSchema],
    historique_modifications: [historiqueModificationSchema],
  },
  {
    timestamps: true,
    collection: 'taches',
  }
);

// Index pour optimiser les requêtes
tacheSchema.index({ projet_id: 1 });
tacheSchema.index({ tache_parent_id: 1 });
tacheSchema.index({ statut: 1 });
tacheSchema.index({ priorite: 1 });
tacheSchema.index({ assignes: 1 });
tacheSchema.index({ date_fin_prevue: 1 });
tacheSchema.index({ tags: 1 });
tacheSchema.index({ dependances: 1 });

// Index composés
tacheSchema.index({ projet_id: 1, statut: 1 });
tacheSchema.index({ projet_id: 1, assignes: 1 });
tacheSchema.index({ tache_parent_id: 1, statut: 1 });

// Hook pre-save pour mettre à jour la progression selon le statut
tacheSchema.pre('save', function(next) {
  if (this.statut === 'TERMINEE' && this.progression !== 100) {
    this.progression = 100;
  }
  if (this.statut === 'A_FAIRE' && this.progression !== 0) {
    this.progression = 0;
  }
  next();
});

// Export du modèle
export const Tache: Model<ITache> = 
  mongoose.models.Tache || mongoose.model<ITache>('Tache', tacheSchema);

