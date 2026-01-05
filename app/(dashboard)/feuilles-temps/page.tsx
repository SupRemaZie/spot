/**
 * Page de liste des feuilles de temps
 */

import { getFeuillesTempsAction } from '@/app/actions/feuilles-temps';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function FeuillesTempsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const membre_id = typeof searchParams.membre_id === 'string' ? searchParams.membre_id : undefined;
  const projet_id = typeof searchParams.projet_id === 'string' ? searchParams.projet_id : undefined;
  const statut = typeof searchParams.statut === 'string' ? searchParams.statut : undefined;

  const result = await getFeuillesTempsAction({
    page,
    limit: 20,
    membre_id,
    projet_id,
    statut: statut as any,
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

  const { feuilles_temps, total, totalPages } = result;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Feuilles de temps</h1>
        <Link
          href="/feuilles-temps/nouvelle"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Nouvelle feuille de temps
        </Link>
      </div>

      {/* Filtres */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <form method="get" className="flex gap-4">
          <input
            type="text"
            name="membre_id"
            placeholder="ID Membre"
            defaultValue={membre_id}
            className="rounded-md border border-gray-300 px-3 py-2"
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
            <option value="BROUILLON">Brouillon</option>
            <option value="SOUMISE">Soumise</option>
            <option value="VALIDEE">Validée</option>
            <option value="REJETEE">Rejetée</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Liste des feuilles de temps */}
      {feuilles_temps.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Aucune feuille de temps trouvée</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {feuilles_temps.map((feuille) => (
              <Link
                key={feuille._id?.toString()}
                href={`/feuilles-temps/${feuille._id}`}
                className="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {typeof feuille.membre_id === 'object' && feuille.membre_id
                          ? `${feuille.membre_id.prenom} ${feuille.membre_id.nom}`
                          : 'Membre'}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          feuille.statut === 'VALIDEE'
                            ? 'bg-green-100 text-green-800'
                            : feuille.statut === 'SOUMISE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : feuille.statut === 'REJETEE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {feuille.statut}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        Projet: {typeof feuille.projet_id === 'object' && feuille.projet_id
                          ? feuille.projet_id.nom
                          : 'Projet'}
                      </p>
                      {typeof feuille.tache_id === 'object' && feuille.tache_id && (
                        <p>Tâche: {feuille.tache_id.titre}</p>
                      )}
                      <p>Date: {format(new Date(feuille.date), 'dd MMM yyyy')}</p>
                      <p className="mt-1 font-medium">Heures: {feuille.heures_travaillees}h</p>
                    </div>
                    {feuille.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                        {feuille.description}
                      </p>
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
                  href={`/feuilles-temps?page=${page - 1}${membre_id ? `&membre_id=${membre_id}` : ''}${projet_id ? `&projet_id=${projet_id}` : ''}${statut ? `&statut=${statut}` : ''}`}
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
                  href={`/feuilles-temps?page=${page + 1}${membre_id ? `&membre_id=${membre_id}` : ''}${projet_id ? `&projet_id=${projet_id}` : ''}${statut ? `&statut=${statut}` : ''}`}
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

