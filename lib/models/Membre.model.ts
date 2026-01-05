/**
 * Modèle Mongoose pour la collection membres
 */

import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IMembre, RolePrincipal, RoleSecondaire, StatutMembre, IConge } from '../types/membre.types';

const membreSchema = new Schema<IMembre>(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
      maxlength: [100, 'Le prénom ne peut pas dépasser 100 caractères'],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true, // Crée automatiquement un index unique
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "L'email n'est pas valide"],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      select: false, // Ne pas retourner le password par défaut
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    },
    telephone: {
      type: String,
      trim: true,
      maxlength: [20, 'Le téléphone ne peut pas dépasser 20 caractères'],
    },
    role_principal: {
      type: String,
      required: [true, 'Le rôle principal est requis'],
      enum: {
        values: ['ADMIN', 'DIRECTEUR', 'CHEF_PROJET', 'MEMBRE', 'OBSERVATEUR'],
        message: 'Le rôle principal doit être ADMIN, DIRECTEUR, CHEF_PROJET, MEMBRE ou OBSERVATEUR',
      },
    },
    roles_secondaires: {
      type: [String],
      enum: {
        values: ['TECHNICAL_LEAD', 'RESPONSABLE_RH', 'COMPTABLE'],
        message: 'Les rôles secondaires doivent être parmi TECHNICAL_LEAD, RESPONSABLE_RH, COMPTABLE',
      },
      default: [],
    },
    statut: {
      type: String,
      required: [true, 'Le statut est requis'],
      enum: {
        values: ['ACTIF', 'INACTIF', 'EN_CONGE', 'SUSPENDU'],
        message: 'Le statut doit être ACTIF, INACTIF, EN_CONGE ou SUSPENDU',
      },
      default: 'ACTIF',
    },
    date_embauche: {
      type: Date,
      required: [true, 'La date d\'embauche est requise'],
    },
    date_depart: {
      type: Date,
      validate: {
        validator: function(this: IMembre, value: Date) {
          return !value || value >= this.date_embauche;
        },
        message: 'La date de départ doit être postérieure à la date d\'embauche',
      },
    },
    competences: {
      type: [String],
      default: [],
    },
    taux_horaire: {
      type: Number,
      min: [0, 'Le taux horaire ne peut pas être négatif'],
    },
    disponibilite_hebdomadaire: {
      type: Number,
      min: [0, 'La disponibilité hebdomadaire ne peut pas être négative'],
      max: [168, 'La disponibilité hebdomadaire ne peut pas dépasser 168 heures'],
    },
    conges: [{
      date_debut: {
        type: Date,
        required: true,
      },
      date_fin: {
        type: Date,
        required: true,
      },
      type: {
        type: String,
        enum: ['ANNUEL', 'MALADIE', 'MATERNITE', 'PATERNITE', 'SANS_SOLDE', 'AUTRE'],
        required: true,
      },
      raison: {
        type: String,
        trim: true,
      },
      statut: {
        type: String,
        enum: ['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE'],
        default: 'PLANIFIE',
      },
    }],
    projets_assignes: [{
      type: Schema.Types.ObjectId,
      ref: 'Projet',
    }],
    taches_assignees: [{
      type: Schema.Types.ObjectId,
      ref: 'Tache',
    }],
  },
  {
    timestamps: true,
    collection: 'membres',
  }
);

// Index pour optimiser les requêtes
// Note: l'index unique sur email est déjà créé par la propriété unique: true du schéma
membreSchema.index({ role_principal: 1 });
membreSchema.index({ statut: 1 });
membreSchema.index({ roles_secondaires: 1 });
membreSchema.index({ projets_assignes: 1 });
membreSchema.index({ taches_assignees: 1 });

// Index composé pour les recherches fréquentes
membreSchema.index({ role_principal: 1, statut: 1 });

// Méthode virtuelle pour le nom complet
membreSchema.virtual('nom_complet').get(function(this: IMembre) {
  return `${this.prenom} ${this.nom}`;
});

// Hook pre-save pour hasher le password avant sauvegarde
membreSchema.pre('save', async function(next) {
  // Ne hasher que si le password a été modifié
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hasher le password avec bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(this.password as string, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Export du modèle
export const Membre: Model<IMembre> = 
  mongoose.models.Membre || mongoose.model<IMembre>('Membre', membreSchema);

