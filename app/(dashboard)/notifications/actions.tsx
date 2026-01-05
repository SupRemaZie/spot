/**
 * Actions pour les notifications
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  archiveNotificationAction,
  deleteNotificationAction,
} from '@/app/actions/notifications';

export function MarkAsReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await markNotificationAsReadAction(notificationId);
      router.refresh();
    } catch (err) {
      alert('Erreur lors du marquage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Marquer lu'}
    </button>
  );
}

export function MarkAllAsReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await markAllNotificationsAsReadAction();
      router.refresh();
    } catch (err) {
      alert('Erreur lors du marquage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Tout marquer comme lu'}
    </button>
  );
}

export function ArchiveButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await archiveNotificationAction(notificationId);
      router.refresh();
    } catch (err) {
      alert('Erreur lors de l\'archivage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Archiver'}
    </button>
  );
}

export function DeleteButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!confirm('Supprimer cette notification ?')) {
      return;
    }
    setLoading(true);
    try {
      await deleteNotificationAction(notificationId);
      router.refresh();
    } catch (err) {
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Supprimer'}
    </button>
  );
}

