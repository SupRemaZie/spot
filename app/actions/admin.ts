/**
 * Server Actions pour l'administration
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getSystemStats,
  createBackup,
  restoreBackup,
  cleanupOldData,
  createTemplateFromProjet,
  createProjetFromTemplate,
  getTemplates,
} from '@/lib/services/admin.service';
import { logCreate } from '@/lib/services/audit.service';

/**
 * Vérifie que l'utilisateur est admin
 */
async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role_principal !== 'ADMIN') {
    throw new Error('Accès refusé - Admin requis');
  }
}

/**
 * Récupère les statistiques système
 */
export async function getSystemStatsAction() {
  try {
    await checkAdmin();

    const stats = await getSystemStats();
    return { success: true, stats };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Crée une sauvegarde
 */
export async function createBackupAction() {
  try {
    await checkAdmin();

    const backup = await createBackup();

    // Audit
    const userId = (await getCurrentUser())?.id;
    if (userId) {
      await logCreate('system', new Date().toISOString(), {
        user_id: userId,
        metadata: { type: 'backup', collections: backup.collections },
      });
    }

    return { success: true, backup };
  } catch (error) {
    console.error('Erreur lors de la création de la sauvegarde:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Restaure une sauvegarde
 */
export async function restoreBackupAction(
  backup: {
    date: Date;
    collections: Record<string, number>;
    data: Record<string, any[]>;
  },
  options: {
    remplacer?: boolean;
    collections?: string[];
  } = {}
) {
  try {
    await checkAdmin();

    const result = await restoreBackup(backup, options);

    // Audit
    const userId = (await getCurrentUser())?.id;
    if (userId) {
      await logCreate('system', new Date().toISOString(), {
        user_id: userId,
        metadata: {
          type: 'restore',
          collections: result.collections_restaurees,
          remplacer: options.remplacer,
        },
      });
    }

    revalidatePath('/admin');
    return { success: result.success, ...result };
  } catch (error) {
    console.error('Erreur lors de la restauration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Nettoie les anciennes données
 */
export async function cleanupOldDataAction(options: {
  notifications_plus_anciennes_jours?: number;
  audit_logs_plus_anciens_jours?: number;
}) {
  try {
    await checkAdmin();

    const result = await cleanupOldData(options);

    // Audit
    const userId = (await getCurrentUser())?.id;
    if (userId) {
      await logCreate('system', new Date().toISOString(), {
        user_id: userId,
        metadata: {
          type: 'cleanup',
          notifications_supprimees: result.notifications_supprimees,
          audit_logs_supprimes: result.audit_logs_supprimes,
        },
      });
    }

    revalidatePath('/admin');
    return { success: true, ...result };
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Crée un template à partir d'un projet
 */
export async function createTemplateFromProjetAction(projetId: string) {
  try {
    await checkAdmin();

    const template = await createTemplateFromProjet(projetId);

    revalidatePath('/admin/templates');
    return { success: true, template };
  } catch (error) {
    console.error('Erreur lors de la création du template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Crée un projet à partir d'un template
 */
export async function createProjetFromTemplateAction(templateId: string, nouveauNom: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const projet = await createProjetFromTemplate(templateId, nouveauNom);

    revalidatePath('/projets');
    return { success: true, projet };
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Récupère les templates
 */
export async function getTemplatesAction() {
  try {
    const templates = await getTemplates();
    return { success: true, templates };
  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      templates: [],
    };
  }
}

