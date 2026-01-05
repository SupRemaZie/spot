/**
 * Page d'administration
 */

import { getSystemStatsAction, cleanupOldDataAction } from '@/app/actions/admin';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { CleanupButton } from './actions';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role_principal !== 'ADMIN') {
    redirect('/dashboard');
  }

  const statsResult = await getSystemStatsAction();

  if (!statsResult.success || !statsResult.stats) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">Erreur: {statsResult.error}</p>
        </div>
      </div>
    );
  }

  const stats = statsResult.stats;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Administration</h1>

      {/* Statistiques système */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Projets</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.projets_total}</p>
          <p className="mt-1 text-xs text-gray-500">{stats.projets_actifs} actifs</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Tâches</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.taches_total}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Membres</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.membres_total}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Taille base</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.taille_base_mb.toFixed(2)} MB</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Feuilles de temps</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.feuilles_temps_total}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Commentaires</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.commentaires_total}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Notifications</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.notifications_total}</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Logs d'audit</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.audit_logs_total}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sauvegarde */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Sauvegarde</h2>
          <p className="mb-4 text-sm text-gray-600">
            Créez une sauvegarde complète de toutes les données
          </p>
          <a
            href="/api/admin/backup"
            className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Télécharger la sauvegarde
          </a>
          <p className="mt-2 text-xs text-gray-500">
            Format JSON - Contient tous les projets, tâches, membres, etc.
          </p>
        </div>

        {/* Maintenance */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Maintenance</h2>
          <p className="mb-4 text-sm text-gray-600">
            Nettoie les anciennes données pour optimiser les performances
          </p>
          <CleanupButton />
          <p className="mt-2 text-xs text-gray-500">
            Supprime les notifications archivées et les logs d'audit anciens
          </p>
        </div>

        {/* Templates */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Templates</h2>
          <p className="mb-4 text-sm text-gray-600">
            Gérez les templates de projets
          </p>
          <Link
            href="/admin/templates"
            className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Voir les templates
          </Link>
        </div>

        {/* Restauration */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Restauration</h2>
          <p className="mb-4 text-sm text-gray-600">
            Restaurez une sauvegarde précédente
          </p>
          <Link
            href="/admin/restore"
            className="inline-block rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Restaurer une sauvegarde
          </Link>
          <p className="mt-2 text-xs text-red-600">
            ⚠️ Attention : La restauration peut écraser les données existantes
          </p>
        </div>
      </div>
    </div>
  );
}

