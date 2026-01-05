/**
 * Modèle Mongoose pour la collection audit_logs
 */

import mongoose, { Schema, Model } from 'mongoose';
import { IAuditLog, ActionAudit, CollectionAudit } from '../types/audit-log.types';

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: [true, 'L\'action est requise'],
      enum: {
        values: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PERMISSION_DENIED', 'EXPORT', 'IMPORT'],
        message: 'L\'action doit être CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, PERMISSION_DENIED, EXPORT ou IMPORT',
      },
    },
    collection: {
      type: String,
      enum: {
        values: ['projets', 'taches', 'membres', 'feuilles_temps', 'commentaires', 'notifications', 'audit_logs'],
        message: 'La collection doit être parmi projets, taches, membres, feuilles_temps, commentaires, notifications, audit_logs',
      },
    },
    document_id: {
      type: Schema.Types.ObjectId,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Membre',
    },
    ip_address: {
      type: String,
      trim: true,
    },
    user_agent: {
      type: String,
      trim: true,
    },
    changes: [{
      champ: String,
      ancienne_valeur: Schema.Types.Mixed,
      nouvelle_valeur: Schema.Types.Mixed,
    }],
    document_snapshot: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      required: [true, 'Le timestamp est requis'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
    suppressReservedKeysWarning: true, // Permet l'utilisation du champ 'collection' qui est réservé
  }
);

// Index pour optimiser les requêtes
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ collection: 1 });
auditLogSchema.index({ document_id: 1 });
auditLogSchema.index({ user_id: 1 });
auditLogSchema.index({ timestamp: -1 }); // Pour trier par date décroissante
auditLogSchema.index({ ip_address: 1 });

// Index composés pour les requêtes fréquentes
auditLogSchema.index({ user_id: 1, timestamp: -1 });
auditLogSchema.index({ collection: 1, document_id: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ collection: 1, action: 1, timestamp: -1 });

// Index TTL pour supprimer automatiquement les logs après 2 ans (optionnel)
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 ans

// Export du modèle
export const AuditLog: Model<IAuditLog> = 
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

