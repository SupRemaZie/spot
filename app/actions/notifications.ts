/**
 * Server Actions pour la gestion des notifications
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/session';
import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  archiveNotification,
  deleteNotification,
} from '@/lib/services/notification.service';
import { INotification, StatutNotification, TypeNotification } from '@/lib/types/notification.types';
import { logCreate, logUpdate, logDelete } from '@/lib/services/audit.service';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { getSession } from '@/lib/auth/session';

/**
 * Vérifie les permissions
 */
async function checkPermission() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Non authentifié');
  }
}

/**
 * Récupère les notifications de l'utilisateur
 */
export async function getNotificationsAction(filters: {
  statut?: StatutNotification;
  type?: TypeNotification;
  non_lues_seulement?: boolean;
  page?: number;
  limit?: number;
}) {
  try {
    await checkPermission();

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const result = await getNotifications(userId, filters);
    return { success: true, ...result };
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      notifications: [],
      total: 0,
      page: 1,
      totalPages: 0,
      non_lues: 0,
    };
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    await checkPermission();

    const notification = await markNotificationAsRead(notificationId);

    revalidatePath('/notifications');
    return { success: true, notification };
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsAsReadAction() {
  try {
    await checkPermission();

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Non authentifié');
    }

    await markAllNotificationsAsRead(userId);

    revalidatePath('/notifications');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors du marquage des notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Archive une notification
 */
export async function archiveNotificationAction(notificationId: string) {
  try {
    await checkPermission();

    const notification = await archiveNotification(notificationId);

    revalidatePath('/notifications');
    return { success: true, notification };
  } catch (error) {
    console.error('Erreur lors de l\'archivage de la notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotificationAction(notificationId: string) {
  try {
    await checkPermission();

    await deleteNotification(notificationId);

    revalidatePath('/notifications');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

