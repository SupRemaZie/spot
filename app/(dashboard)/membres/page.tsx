/**
 * Page de liste des membres
 */

import { getMembresAction, getMembresSurchargeAction, getMembresSousUtilisationAction } from '@/app/actions/membres';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function MembresPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const role_principal = typeof searchParams.role_principal === 'string' ? searchParams.role_principal : undefined;
  const statut = typeof searchParams.statut === 'string' ? searchParams.statut : undefined;
  const recherche = typeof searchParams.recherche === 'string' ? searchParams.recherche : undefined;

  const result = await getMembresAction({
    page,
    limit: 20,
    role_principal: role_principal as any,
    statut: statut as any,
    recherche,
  });

  // Récupérer les membres en surcharge et sous-utilisation
  const surchargeResult = await getMembresSurchargeAction(100);
  const sousUtilisationResult = await getMembresSousUtilisationAction(50);

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">Erreur: {result.error}</p>
        </div>
      </div>
    );
  }

  const { membres, total, totalPages } = result;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Membres</h1>
        <Link
          href="/membres/nouveau"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Nouveau membre
        </Link>
      </div>

      {/* Alertes surcharge/sous-utilisation */}
      {surchargeResult.success && surchargeResult.membres.length > 0 && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            ⚠️ {surchargeResult.membres.length} membre(s) en surcharge
          </p>
        </div>
      )}

      {sousUtilisationResult.success && sousUtilisationResult.membres.length > 0 && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            ℹ️ {sousUtilisationResult.membres.length} membre(s) en sous-utilisation
          </p>
        </div>
      )}

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
            name="role_principal"
            defaultValue={role_principal || ''}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Admin</option>
            <option value="DIRECTEUR">Directeur</option>
            <option value="CHEF_PROJET">Chef de projet</option>
            <option value="MEMBRE">Membre</option>
            <option value="OBSERVATEUR">Observateur</option>
          </select>
          <select
            name="statut"
            defaultValue={statut || ''}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
            <option value="EN_CONGE">En congé</option>
            <option value="SUSPENDU">Suspendu</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Liste des membres */}
      {membres.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Aucun membre trouvé</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {membres.map((membre) => {
              const isSurcharge = surchargeResult.success && 
                surchargeResult.membres.some(m => m.membre._id?.toString() === membre._id?.toString());
              const isSousUtilisation = sousUtilisationResult.success && 
                sousUtilisationResult.membres.some(m => m.membre._id?.toString() === membre._id?.toString());

              return (
                <Link
                  key={membre._id?.toString()}
                  href={`/membres/${membre._id}`}
                  className={`block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg ${
                    isSurcharge ? 'border-2 border-red-300' : isSousUtilisation ? 'border-2 border-yellow-300' : ''
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {membre.prenom} {membre.nom}
                      </h2>
                      <p className="text-sm text-gray-500">{membre.email}</p>
                    </div>
                    {isSurcharge && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Surcharge
                      </span>
                    )}
                    {isSousUtilisation && !isSurcharge && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                        Sous-utilisation
                      </span>
                    )}
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Rôle</span>
                      <span className="font-medium">{membre.role_principal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Statut</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          membre.statut === 'ACTIF'
                            ? 'bg-green-100 text-green-800'
                            : membre.statut === 'EN_CONGE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {membre.statut}
                      </span>
                    </div>
                    {membre.disponibilite_hebdomadaire && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Disponibilité</span>
                        <span className="font-medium">{membre.disponibilite_hebdomadaire}h/semaine</span>
                      </div>
                    )}
                    {membre.competences && membre.competences.length > 0 && (
                      <div>
                        <span className="text-gray-500">Compétences</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {membre.competences.slice(0, 3).map((comp, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-800"
                            >
                              {comp}
                            </span>
                          ))}
                          {membre.competences.length > 3 && (
                            <span className="text-xs text-gray-500">+{membre.competences.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/membres?page=${page - 1}${role_principal ? `&role_principal=${role_principal}` : ''}${statut ? `&statut=${statut}` : ''}${recherche ? `&recherche=${recherche}` : ''}`}
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
                  href={`/membres?page=${page + 1}${role_principal ? `&role_principal=${role_principal}` : ''}${statut ? `&statut=${statut}` : ''}${recherche ? `&recherche=${recherche}` : ''}`}
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
