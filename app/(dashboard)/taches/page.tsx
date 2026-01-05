/**
 * Page de liste des tâches
 */

import { getTachesAction } from '@/app/actions/taches';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TachesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const projet_id = typeof searchParams.projet_id === 'string' ? searchParams.projet_id : undefined;
  const statut = typeof searchParams.statut === 'string' ? searchParams.statut : undefined;
  const recherche = typeof searchParams.recherche === 'string' ? searchParams.recherche : undefined;

  const result = await getTachesAction({
    page,
    limit: 20,
    projet_id,
    statut: statut as any,
    recherche,
    tache_parent_id: null, // Tâches principales uniquement
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

  const { taches, total, totalPages } = result;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tâches</h1>
        <Link
          href="/taches/nouvelle"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Nouvelle tâche
        </Link>
      </div>

      {/* Filtres */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <form method="get" className="flex gap-4">
          <input
            type="text"
            name="recherche"
            placeholder="Rechercher..."
            defaultValue={recherche}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
          />
          <input
            type="text"
            name="projet_id"
            placeholder="ID Projet"
            defaultValue={projet_id}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          <select
            name="statut"
            defaultValue={statut || ''}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Tous les statuts</option>
            <option value="A_FAIRE">À faire</option>
            <option value="EN_COURS">En cours</option>
            <option value="EN_PAUSE">En pause</option>
            <option value="EN_REVUE">En revue</option>
            <option value="TERMINEE">Terminée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Liste des tâches */}
      {taches.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Aucune tâche trouvée</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {taches.map((tache) => (
              <Link
                key={tache._id?.toString()}
                href={`/taches/${tache._id}`}
                className="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-gray-900">{tache.titre}</h2>
                      {tache.tache_parent_id && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          Sous-tâche
                        </span>
                      )}
                    </div>
                    {typeof tache.projet_id === 'object' && tache.projet_id && (
                      <p className="mt-1 text-sm text-gray-500">
                        Projet: {tache.projet_id.nom} {tache.projet_id.code_projet && `(${tache.projet_id.code_projet})`}
                      </p>
                    )}
                    {tache.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {tache.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          tache.statut === 'EN_COURS'
                            ? 'bg-green-100 text-green-800'
                            : tache.statut === 'TERMINEE'
                            ? 'bg-gray-100 text-gray-800'
                            : tache.statut === 'EN_PAUSE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tache.statut}
                      </span>
                      <span className={`font-medium ${
                        tache.priorite === 'CRITIQUE'
                          ? 'text-red-600'
                          : tache.priorite === 'ELEVEE'
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`}>
                        {tache.priorite}
                      </span>
                      {tache.progression !== undefined && (
                        <span>Progression: {tache.progression}%</span>
                      )}
                      {tache.charge_estimee && (
                        <span>Charge: {tache.charge_estimee}h</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {tache.progression !== undefined && (
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-indigo-600"
                          style={{ width: `${tache.progression}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/taches?page=${page - 1}${statut ? `&statut=${statut}` : ''}${recherche ? `&recherche=${recherche}` : ''}${projet_id ? `&projet_id=${projet_id}` : ''}`}
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
                  href={`/taches?page=${page + 1}${statut ? `&statut=${statut}` : ''}${recherche ? `&recherche=${recherche}` : ''}${projet_id ? `&projet_id=${projet_id}` : ''}`}
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

