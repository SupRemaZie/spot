/**
 * Modèle Mongoose pour la collection notifications
 */

import mongoose, { Schema, Model } from 'mongoose';
import { INotification, TypeNotification, StatutNotification, CanalNotification } from '../types/notification.types';

const notificationSchema = new Schema<INotification>(
  {
    destinataire_id: {
      type: Schema.Types.ObjectId,
      ref: 'Membre',
      required: [true, 'Le destinataire est requis'],
    },
    type: {
      type: String,
      required: [true, 'Le type de notification est requis'],
      enum: {
        values: ['ASSIGNATION', 'MENTION', 'MODIFICATION', 'COMMENTAIRE', 'ECHEANCE', 'VALIDATION', 'SYSTEME'],
        message: 'Le type doit être ASSIGNATION, MENTION, MODIFICATION, COMMENTAIRE, ECHEANCE, VALIDATION ou SYSTEME',
      },
    },
    titre: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
      maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères'],
    },
    message: {
      type: String,
      required: [true, 'Le message est requis'],
      trim: true,
      maxlength: [2000, 'Le message ne peut pas dépasser 2000 caractères'],
    },
    ressource_type: {
      type: String,
      trim: true,
    },
    ressource_id: {
      type: Schema.Types.ObjectId,
    },
    statut: {
      type: String,
      required: [true, 'Le statut est requis'],
      enum: {
        values: ['NON_LUE', 'LUE', 'ARCHIVEE'],
        message: 'Le statut doit être NON_LUE, LUE ou ARCHIVEE',
      },
      default: 'NON_LUE',
    },
    canal: {
      type: String,
      required: [true, 'Le canal est requis'],
      enum: {
        values: ['APP', 'EMAIL', 'APP_ET_EMAIL'],
        message: 'Le canal doit être APP, EMAIL ou APP_ET_EMAIL',
      },
      default: 'APP',
    },
    lu_le: {
      type: Date,
    },
    action_url: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

// Index pour optimiser les requêtes
notificationSchema.index({ destinataire_id: 1 });
notificationSchema.index({ statut: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ ressource_type: 1, ressource_id: 1 });
notificationSchema.index({ createdAt: -1 }); // Pour trier par date décroissante

// Index composés pour les requêtes fréquentes
notificationSchema.index({ destinataire_id: 1, statut: 1 });
notificationSchema.index({ destinataire_id: 1, createdAt: -1 });
notificationSchema.index({ destinataire_id: 1, statut: 1, createdAt: -1 });

// Hook pre-save pour mettre à jour lu_le
notificationSchema.pre('save', function(next) {
  if (this.statut === 'LUE' && !this.lu_le) {
    this.lu_le = new Date();
  }
  if (this.statut === 'NON_LUE') {
    this.lu_le = undefined;
  }
  next();
});

// Export du modèle
export const Notification: Model<INotification> = 
  mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

