/**
 * Page de liste des notifications
 */

import { getNotificationsAction } from '@/app/actions/notifications';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { MarkAllAsReadButton, MarkAsReadButton, ArchiveButton, DeleteButton } from './actions';

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const statut = typeof searchParams.statut === 'string' ? searchParams.statut : undefined;
  const type = typeof searchParams.type === 'string' ? searchParams.type : undefined;
  const non_lues_seulement = searchParams.non_lues === 'true';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;

  const result = await getNotificationsAction({
    statut: statut as any,
    type: type as any,
    non_lues_seulement,
    page,
    limit: 20,
  });

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">Erreur: {result.error}</p>
        </div>
      </div>
    );
  }

  const { notifications, total, totalPages, non_lues } = result;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {non_lues > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {non_lues} notification{non_lues > 1 ? 's' : ''} non lue{non_lues > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {non_lues > 0 && (
          <MarkAllAsReadButton />
        )}
      </div>

      {/* Filtres */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <form method="get" className="flex gap-4">
          <select
            name="statut"
            defaultValue={statut || ''}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Tous les statuts</option>
            <option value="NON_LUE">Non lues</option>
            <option value="LUE">Lues</option>
            <option value="ARCHIVEE">Archivées</option>
          </select>
          <select
            name="type"
            defaultValue={type || ''}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Tous les types</option>
            <option value="ASSIGNATION">Assignation</option>
            <option value="MENTION">Mention</option>
            <option value="MODIFICATION">Modification</option>
            <option value="COMMENTAIRE">Commentaire</option>
            <option value="ECHEANCE">Échéance</option>
            <option value="VALIDATION">Validation</option>
            <option value="SYSTEME">Système</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="non_lues"
              value="true"
              defaultChecked={non_lues_seulement}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Non lues uniquement</span>
          </label>
          <button
            type="submit"
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Liste des notifications */}
      {notifications.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Aucune notification</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id?.toString()}
                className={`rounded-lg border p-4 shadow transition-shadow ${
                  notification.statut === 'NON_LUE'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{notification.titre}</h3>
                      {notification.statut === 'NON_LUE' && (
                        <span className="rounded-full bg-indigo-600 px-2 py-1 text-xs font-medium text-white">
                          Nouveau
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          notification.type === 'ASSIGNATION'
                            ? 'bg-blue-100 text-blue-800'
                            : notification.type === 'MENTION'
                            ? 'bg-purple-100 text-purple-800'
                            : notification.type === 'ECHEANCE'
                            ? 'bg-red-100 text-red-800'
                            : notification.type === 'VALIDATION'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {notification.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      {notification.createdAt && (
                        <span>{format(new Date(notification.createdAt), 'dd MMM yyyy à HH:mm')}</span>
                      )}
                      {notification.action_url && (
                        <Link
                          href={notification.action_url}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Voir →
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    {notification.statut === 'NON_LUE' && (
                      <MarkAsReadButton notificationId={notification._id!.toString()} />
                    )}
                    {notification.statut !== 'ARCHIVEE' && (
                      <ArchiveButton notificationId={notification._id!.toString()} />
                    )}
                    <DeleteButton notificationId={notification._id!.toString()} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/notifications?page=${page - 1}${statut ? `&statut=${statut}` : ''}${type ? `&type=${type}` : ''}${non_lues_seulement ? '&non_lues=true' : ''}`}
                  className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  Précédent
                </Link>
              )}
              <span className="px-4 py-2">
                Page {page} sur {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/notifications?page=${page + 1}${statut ? `&statut=${statut}` : ''}${type ? `&type=${type}` : ''}${non_lues_seulement ? '&non_lues=true' : ''}`}
                  className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  Suivant
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

