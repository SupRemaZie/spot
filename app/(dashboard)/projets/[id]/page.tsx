/**
 * Page de détail d'un projet
 */

import { getProjetAction, getProjetStatsAction } from '@/app/actions/projets';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function ProjetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const result = await getProjetAction(params.id);
  const statsResult = await getProjetStatsAction(params.id);

  if (!result.success || !result.projet) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">Erreur: {result.error || 'Projet non trouvé'}</p>
        </div>
      </div>
    );
  }

  const projet = result.projet;
  const stats = statsResult.success ? statsResult.stats : null;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/projets"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Retour à la liste
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{projet.nom}</h1>
          {projet.code_projet && (
            <p className="mt-1 text-sm text-gray-500">{projet.code_projet}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projets/${params.id}/editer`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Modifier
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {projet.description && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Description</h2>
              <p className="text-gray-700">{projet.description}</p>
            </div>
          )}

          {/* Jalons */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Jalons</h2>
              <span className="text-sm text-gray-500">
                {stats?.jalons_atteints || 0} / {stats?.jalons_total || 0} atteints
              </span>
            </div>
            {projet.jalons && projet.jalons.length > 0 ? (
              <div className="space-y-3">
                {projet.jalons.map((jalon) => (
                  <div
                    key={jalon.id}
                    className={`rounded-md border p-3 ${
                      jalon.est_atteint
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{jalon.nom}</h3>
                        {jalon.description && (
                          <p className="mt-1 text-sm text-gray-600">{jalon.description}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Prévu: {format(new Date(jalon.date_prevue), 'dd MMM yyyy')}
                          {jalon.date_reelle && (
                            <> • Réel: {format(new Date(jalon.date_reelle), 'dd MMM yyyy')}</>
                          )}
                        </p>
                      </div>
                      {jalon.est_atteint && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Atteint
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun jalon défini</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut et priorité */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Informations</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Statut</span>
                <p className="mt-1">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
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
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Priorité</span>
                <p className="mt-1">
                  <span
                    className={`font-medium ${
                      projet.priorite === 'CRITIQUE'
                        ? 'text-red-600'
                        : projet.priorite === 'ELEVEE'
                        ? 'text-orange-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {projet.priorite}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Budget</h2>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">Alloué</span>
                  <span className="font-medium">{projet.budget_alloue} €</span>
                </div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">Consommé</span>
                  <span className="font-medium">{projet.budget_consomme || 0} €</span>
                </div>
                {stats && (
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-xs text-gray-500">
                      <span>Utilisation</span>
                      <span>{stats.budget_utilise_pourcentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full ${
                          stats.budget_utilise_pourcentage > 100
                            ? 'bg-red-500'
                            : stats.budget_utilise_pourcentage > 80
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(stats.budget_utilise_pourcentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Dates</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Début prévu</span>
                <p className="font-medium">
                  {format(new Date(projet.date_debut_prevue), 'dd MMM yyyy')}
                </p>
              </div>
              {projet.date_debut_reelle && (
                <div>
                  <span className="text-gray-500">Début réel</span>
                  <p className="font-medium">
                    {format(new Date(projet.date_debut_reelle), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Fin prévue</span>
                <p className="font-medium">
                  {format(new Date(projet.date_fin_prevue), 'dd MMM yyyy')}
                </p>
              </div>
              {projet.date_fin_reelle && (
                <div>
                  <span className="text-gray-500">Fin réelle</span>
                  <p className="font-medium">
                    {format(new Date(projet.date_fin_reelle), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
              {stats && stats.jours_restants > 0 && (
                <div>
                  <span className="text-gray-500">Jours restants</span>
                  <p className="font-medium">{stats.jours_restants} jours</p>
                </div>
              )}
            </div>
          </div>

          {/* Membres */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Équipe</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Chef de projet</span>
                <p className="font-medium">
                  {typeof projet.chef_projet === 'object' && projet.chef_projet
                    ? `${projet.chef_projet.prenom} ${projet.chef_projet.nom}`
                    : 'Non assigné'}
                </p>
              </div>
              {projet.membres_assignes && projet.membres_assignes.length > 0 && (
                <div>
                  <span className="text-gray-500">Membres ({projet.membres_assignes.length})</span>
                  <ul className="mt-1 space-y-1">
                    {projet.membres_assignes.map((membre: any, index: number) => (
                      <li key={index} className="font-medium">
                        {typeof membre === 'object' && membre
                          ? `${membre.prenom} ${membre.nom}`
                          : membre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {projet.tags && projet.tags.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {projet.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
