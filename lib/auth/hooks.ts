/**
 * Hooks pour l'audit automatique des opérations MongoDB
 * S'intègrent avec les hooks Mongoose pour logger automatiquement
 */

import { createAuditLog, logCreate, logUpdate, logDelete } from '../services/audit.service';
import { CollectionAudit } from '../types/audit-log.types';
import { Types } from 'mongoose';

/**
 * Récupère l'ID utilisateur depuis le contexte (session, headers, etc.)
 * À adapter selon votre implémentation
 */
function getCurrentUserId(): Types.ObjectId | string | undefined {
  // Cette fonction doit être adaptée pour récupérer l'ID utilisateur
  // depuis la session NextAuth ou un contexte global
  // Pour l'instant, retourne undefined (sera passé explicitement)
  return undefined;
}

/**
 * Récupère l'IP et le user-agent depuis la requête
 */
function getRequestMetadata(): { ip_address?: string; user_agent?: string } {
  // À adapter pour récupérer depuis les headers de la requête
  return {};
}

/**
 * Hook Mongoose pour logger automatiquement les créations
 */
export function setupCreateAuditHook(
  modelName: string,
  collection: CollectionAudit
) {
  return async function(doc: any) {
    const userId = getCurrentUserId();
    const metadata = getRequestMetadata();

    if (userId) {
      await logCreate(collection, doc._id, {
        user_id: userId,
        ...metadata,
      });
    }
  };
}

/**
 * Hook Mongoose pour logger automatiquement les modifications
 */
export function setupUpdateAuditHook(
  modelName: string,
  collection: CollectionAudit
) {
  return async function(doc: any) {
    const userId = getCurrentUserId();
    const metadata = getRequestMetadata();

    if (userId && doc.isModified()) {
      const changes = Object.keys(doc.modifiedPaths()).map((path) => ({
        champ: path,
        ancienne_valeur: doc.get(path, null, { getters: false }),
        nouvelle_valeur: doc.get(path),
      }));

      await logUpdate(collection, doc._id, changes, {
        user_id: userId,
        ...metadata,
      });
    }
  };
}

/**
 * Hook Mongoose pour logger automatiquement les suppressions
 */
export function setupDeleteAuditHook(
  modelName: string,
  collection: CollectionAudit
) {
  return async function(doc: any) {
    const userId = getCurrentUserId();
    const metadata = getRequestMetadata();

    if (userId) {
      // Créer un snapshot avant suppression
      const snapshot = doc.toObject();

      await logDelete(collection, doc._id, snapshot, {
        user_id: userId,
        ...metadata,
      });
    }
  };
}

/**
 * Fonction helper pour logger une action avec l'ID utilisateur explicite
 * À utiliser dans les Server Actions et API Routes
 */
export async function auditAction(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ',
  collection: CollectionAudit,
  document_id: Types.ObjectId | string,
  userId?: Types.ObjectId | string,
  changes?: Array<{
    champ: string;
    ancienne_valeur: unknown;
    nouvelle_valeur: unknown;
  }>,
  document_snapshot?: Record<string, unknown>
) {
  const metadata = getRequestMetadata();

  switch (action) {
    case 'CREATE':
      if (userId) {
        await logCreate(collection, document_id, { user_id: userId, ...metadata });
      }
      break;
    case 'UPDATE':
      if (userId && changes) {
        await logUpdate(collection, document_id, changes, { user_id: userId, ...metadata });
      }
      break;
    case 'DELETE':
      if (userId && document_snapshot) {
        await logDelete(collection, document_id, document_snapshot, { user_id: userId, ...metadata });
      }
      break;
    case 'READ':
      // Log READ uniquement pour données sensibles
      if (userId) {
        await createAuditLog('READ', {
          collection,
          document_id,
          user_id: userId,
          ...metadata,
        });
      }
      break;
  }
}

