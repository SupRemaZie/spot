/**
 * Page de détail d'une tâche
 */

import { getTacheAction, getSousTachesAction, getTacheStatsAction, canStartTacheAction } from '@/app/actions/taches';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function TacheDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const result = await getTacheAction(params.id);
  const sousTachesResult = await getSousTachesAction(params.id);
  const statsResult = await getTacheStatsAction(params.id);
  const canStartResult = await canStartTacheAction(params.id);

  if (!result.success || !result.tache) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">Erreur: {result.error || 'Tâche non trouvée'}</p>
        </div>
      </div>
    );
  }

  const tache = result.tache;
  const sousTaches = sousTachesResult.success ? sousTachesResult.sousTaches : [];
  const stats = statsResult.success ? statsResult.stats : null;
  const canStart = canStartResult.success ? canStartResult.canStart : true;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/taches"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Retour à la liste
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{tache.titre}</h1>
          {typeof tache.projet_id === 'object' && tache.projet_id && (
            <Link
              href={`/projets/${tache.projet_id._id}`}
              className="mt-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              Projet: {tache.projet_id.nom}
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/taches/${params.id}/editer`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Modifier
          </Link>
          <Link
            href={`/taches/nouvelle?tache_parent_id=${params.id}`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Ajouter sous-tâche
          </Link>
        </div>
      </div>

      {!canStart && canStartResult.success && canStartResult.blockingDependencies.length > 0 && (
        <div className="mb-6 rounded-md bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            ⚠️ Cette tâche ne peut pas être démarrée car les dépendances suivantes ne sont pas terminées :
          </p>
          <ul className="mt-2 list-disc pl-5">
            {canStartResult.blockingDependencies.map((dep: any) => (
              <li key={dep._id} className="text-sm text-yellow-700">
                <Link href={`/taches/${dep._id}`} className="underline">
                  {dep.titre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {tache.description && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Description</h2>
              <p className="text-gray-700">{tache.description}</p>
            </div>
          )}

          {/* Sous-tâches */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Sous-tâches</h2>
              <span className="text-sm text-gray-500">
                {stats?.sous_taches_terminees || 0} / {stats?.sous_taches_total || 0} terminées
              </span>
            </div>
            {sousTaches.length > 0 ? (
              <div className="space-y-3">
                {sousTaches.map((sousTache) => (
                  <Link
                    key={sousTache._id?.toString()}
                    href={`/taches/${sousTache._id}`}
                    className="block rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{sousTache.titre}</h3>
                        {sousTache.description && (
                          <p className="mt-1 text-sm text-gray-600">{sousTache.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span
                            className={`rounded-full px-2 py-1 ${
                              sousTache.statut === 'TERMINEE'
                                ? 'bg-green-100 text-green-800'
                                : sousTache.statut === 'EN_COURS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sousTache.statut}
                          </span>
                          {sousTache.progression !== undefined && (
                            <span>Progression: {sousTache.progression}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucune sous-tâche</p>
            )}
          </div>

          {/* Dépendances */}
          {tache.dependances && tache.dependances.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Dépendances</h2>
              <div className="space-y-3">
                {tache.dependances.map((dep: any, index: number) => (
                  <Link
                    key={typeof dep === 'object' ? dep._id : dep}
                    href={`/taches/${typeof dep === 'object' ? dep._id : dep}`}
                    className="block rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {typeof dep === 'object' ? dep.titre : `Tâche ${index + 1}`}
                        </h3>
                        {typeof dep === 'object' && dep.statut && (
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-1 text-xs ${
                              dep.statut === 'TERMINEE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {dep.statut}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pièces jointes */}
          {tache.pieces_jointes && tache.pieces_jointes.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Pièces jointes</h2>
              <div className="space-y-2">
                {tache.pieces_jointes.map((pj, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                  >
                    <div>
                      <p className="font-medium">{pj.nom}</p>
                      <p className="text-xs text-gray-500">
                        {(pj.taille / 1024).toFixed(2)} KB • {pj.type_mime}
                      </p>
                    </div>
                    <a
                      href={pj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Télécharger
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tache.tags && tache.tags.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tache.tags.map((tag, index) => (
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
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Priorité</span>
                <p className="mt-1">
                  <span
                    className={`font-medium ${
                      tache.priorite === 'CRITIQUE'
                        ? 'text-red-600'
                        : tache.priorite === 'ELEVEE'
                        ? 'text-orange-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {tache.priorite}
                  </span>
                </p>
              </div>
              {tache.progression !== undefined && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Progression</span>
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-xs text-gray-500">
                      <span>{tache.progression}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-indigo-600"
                        style={{ width: `${tache.progression}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Charge */}
          {(tache.charge_estimee || tache.charge_reelle) && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Charge</h2>
              <div className="space-y-2 text-sm">
                {tache.charge_estimee && (
                  <div>
                    <span className="text-gray-500">Estimée</span>
                    <p className="font-medium">{tache.charge_estimee}h</p>
                  </div>
                )}
                {tache.charge_reelle && (
                  <div>
                    <span className="text-gray-500">Réelle</span>
                    <p className="font-medium">{tache.charge_reelle}h</p>
                  </div>
                )}
                {stats && stats.charge_ecart !== 0 && (
                  <div>
                    <span className="text-gray-500">Écart</span>
                    <p className={`font-medium ${stats.charge_ecart > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.charge_ecart > 0 ? '+' : ''}{stats.charge_ecart.toFixed(1)}h
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          {(tache.date_debut_prevue || tache.date_fin_prevue) && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Dates</h2>
              <div className="space-y-3 text-sm">
                {tache.date_debut_prevue && (
                  <div>
                    <span className="text-gray-500">Début prévu</span>
                    <p className="font-medium">
                      {format(new Date(tache.date_debut_prevue), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {tache.date_debut_reelle && (
                  <div>
                    <span className="text-gray-500">Début réel</span>
                    <p className="font-medium">
                      {format(new Date(tache.date_debut_reelle), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {tache.date_fin_prevue && (
                  <div>
                    <span className="text-gray-500">Fin prévue</span>
                    <p className="font-medium">
                      {format(new Date(tache.date_fin_prevue), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {tache.date_fin_reelle && (
                  <div>
                    <span className="text-gray-500">Fin réelle</span>
                    <p className="font-medium">
                      {format(new Date(tache.date_fin_reelle), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Membres assignés */}
          {tache.assignes && tache.assignes.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Membres assignés</h2>
              <div className="space-y-2 text-sm">
                {tache.assignes.map((membre: any, index: number) => (
                  <div key={index}>
                    {typeof membre === 'object' && membre ? (
                      <p className="font-medium">{membre.prenom} {membre.nom}</p>
                    ) : (
                      <p className="font-medium">Membre {index + 1}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

