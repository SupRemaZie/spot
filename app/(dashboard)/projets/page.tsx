/**
 * Page de liste des projets
 */

import { getProjetsAction } from '@/app/actions/projets';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const statut = typeof searchParams.statut === 'string' ? searchParams.statut : undefined;
  const recherche = typeof searchParams.recherche === 'string' ? searchParams.recherche : undefined;

  const result = await getProjetsAction({
    page,
    limit: 20,
    statut: statut as any,
    recherche,
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

  const { projets, total, totalPages } = result;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Projets</h1>
        <Link
          href="/projets/nouveau"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Nouveau projet
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
          <select
            name="statut"
            defaultValue={statut || ''}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Tous les statuts</option>
            <option value="PLANIFICATION">Planification</option>
            <option value="EN_COURS">En cours</option>
            <option value="EN_PAUSE">En pause</option>
            <option value="TERMINE">Terminé</option>
            <option value="ANNULE">Annulé</option>
            <option value="ARCHIVE">Archivé</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Liste des projets */}
      {projets.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Aucun projet trouvé</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projets.map((projet) => (
              <Link
                key={projet._id?.toString()}
                href={`/projets/${projet._id}`}
                className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{projet.nom}</h2>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      projet.statut === 'EN_COURS'
                        ? 'bg-green-100 text-green-800'
                        : projet.statut === 'TERMINE'
                        ? 'bg-gray-100 text-gray-800'
                        : projet.statut === 'ARCHIVE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {projet.statut}
                  </span>
                </div>
                {projet.code_projet && (
                  <p className="mb-2 text-sm text-gray-500">{projet.code_projet}</p>
                )}
                {projet.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                    {projet.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Budget: {projet.budget_consomme || 0} / {projet.budget_alloue} €
                  </span>
                  <span className={`font-medium ${
                    projet.priorite === 'CRITIQUE'
                      ? 'text-red-600'
                      : projet.priorite === 'ELEVEE'
                      ? 'text-orange-600'
                      : 'text-gray-600'
                  }`}>
                    {projet.priorite}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/projets?page=${page - 1}${statut ? `&statut=${statut}` : ''}${recherche ? `&recherche=${recherche}` : ''}`}
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
                  href={`/projets?page=${page + 1}${statut ? `&statut=${statut}` : ''}${recherche ? `&recherche=${recherche}` : ''}`}
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
