/**
 * Service d'audit automatique
 * Utilisé par les hooks Mongoose pour logger automatiquement les actions
 */

import { AuditLog } from '../models';
import { ActionAudit, CollectionAudit } from '../types/audit-log.types';
import { Types } from 'mongoose';
import connectDB from '../db/mongodb';

interface AuditOptions {
  user_id?: Types.ObjectId | string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Crée un log d'audit
 */
export async function createAuditLog(
  action: ActionAudit,
  options: AuditOptions & {
    collection?: CollectionAudit;
    document_id?: Types.ObjectId | string;
    changes?: Array<{
      champ: string;
      ancienne_valeur: unknown;
      nouvelle_valeur: unknown;
    }>;
    document_snapshot?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    // S'assurer que MongoDB est connecté avant de créer le log
    await connectDB();
    
    await AuditLog.create({
      action,
      collection: options.collection,
      document_id: options.document_id,
      user_id: options.user_id,
      ip_address: options.ip_address,
      user_agent: options.user_agent,
      changes: options.changes,
      document_snapshot: options.document_snapshot,
      metadata: options.metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    // Ne pas faire échouer l'opération principale si l'audit échoue
    console.error('❌ Erreur lors de la création du log d\'audit:', error);
  }
}

/**
 * Log une action de création
 */
export async function logCreate(
  collection: CollectionAudit,
  document_id: Types.ObjectId | string,
  options: AuditOptions
): Promise<void> {
  await createAuditLog('CREATE', {
    collection,
    document_id,
    ...options,
  });
}

/**
 * Log une action de modification
 */
export async function logUpdate(
  collection: CollectionAudit,
  document_id: Types.ObjectId | string,
  changes: Array<{
    champ: string;
    ancienne_valeur: unknown;
    nouvelle_valeur: unknown;
  }>,
  options: AuditOptions
): Promise<void> {
  await createAuditLog('UPDATE', {
    collection,
    document_id,
    changes,
    ...options,
  });
}

/**
 * Log une action de suppression
 */
export async function logDelete(
  collection: CollectionAudit,
  document_id: Types.ObjectId | string,
  document_snapshot: Record<string, unknown>,
  options: AuditOptions
): Promise<void> {
  await createAuditLog('DELETE', {
    collection,
    document_id,
    document_snapshot,
    ...options,
  });
}

/**
 * Log une action de lecture (pour données sensibles uniquement)
 */
export async function logRead(
  collection: CollectionAudit,
  document_id: Types.ObjectId | string,
  options: AuditOptions
): Promise<void> {
  await createAuditLog('READ', {
    collection,
    document_id,
    ...options,
  });
}

