/**
 * Page de détail d'un membre
 */

import { getMembreAction, getMembreStatsAction, getChargeTravailAction } from '@/app/actions/membres';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function MembreDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const result = await getMembreAction(params.id);
  const statsResult = await getMembreStatsAction(params.id);
  const chargeResult = await getChargeTravailAction(params.id);

  if (!result.success || !result.membre) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">Erreur: {result.error || 'Membre non trouvé'}</p>
        </div>
      </div>
    );
  }

  const membre = result.membre;
  const stats = statsResult.success ? statsResult.stats : null;
  const charge = chargeResult.success ? chargeResult.charge : null;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/membres"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Retour à la liste
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {membre.prenom} {membre.nom}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{membre.email}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/membres/${params.id}/editer`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Modifier
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charge de travail */}
          {charge && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Charge de travail</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Charge estimée</span>
                    <p className="text-2xl font-bold">{charge.charge_estimee}h</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Charge réelle</span>
                    <p className="text-2xl font-bold">{charge.charge_reelle}h</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Disponibilité</span>
                    <p className="text-2xl font-bold">{charge.disponibilite}h</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Utilisation</span>
                    <p className={`text-2xl font-bold ${
                      charge.surcharge ? 'text-red-600' : charge.sous_utilisation ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {charge.pourcentage_utilisation.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>Utilisation de la disponibilité</span>
                    <span>{charge.pourcentage_utilisation.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full ${
                        charge.surcharge ? 'bg-red-500' : charge.sous_utilisation ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(charge.pourcentage_utilisation, 100)}%` }}
                    />
                  </div>
                  {charge.surcharge && (
                    <p className="mt-2 text-sm text-red-600">⚠️ Surcharge détectée</p>
                  )}
                  {charge.sous_utilisation && (
                    <p className="mt-2 text-sm text-yellow-600">ℹ️ Sous-utilisation détectée</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Statistiques */}
          {stats && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Statistiques</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Projets actifs</span>
                  <p className="text-2xl font-bold">{stats.projets_actifs}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tâches actives</span>
                  <p className="text-2xl font-bold">{stats.taches_actives}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Tâches terminées</span>
                  <p className="text-2xl font-bold">{stats.taches_terminees}</p>
                </div>
              </div>
            </div>
          )}

          {/* Compétences */}
          {membre.competences && membre.competences.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Compétences</h2>
              <div className="flex flex-wrap gap-2">
                {membre.competences.map((comp, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Congés */}
          {membre.conges && membre.conges.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Congés</h2>
              <div className="space-y-3">
                {membre.conges.map((conge, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-gray-200 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {format(new Date(conge.date_debut), 'dd MMM yyyy')} - {format(new Date(conge.date_fin), 'dd MMM yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">{conge.type}</p>
                        {conge.raison && (
                          <p className="mt-1 text-sm text-gray-600">{conge.raison}</p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          conge.statut === 'EN_COURS'
                            ? 'bg-green-100 text-green-800'
                            : conge.statut === 'PLANIFIE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {conge.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projets assignés */}
          {membre.projets_assignes && membre.projets_assignes.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Projets assignés</h2>
              <div className="space-y-2">
                {membre.projets_assignes.map((projet: any, index: number) => (
                  <Link
                    key={index}
                    href={`/projets/${projet._id}`}
                    className="block rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <p className="font-medium">{projet.nom}</p>
                    {projet.code_projet && (
                      <p className="text-sm text-gray-500">{projet.code_projet}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tâches assignées */}
          {membre.taches_assignees && membre.taches_assignees.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Tâches assignées</h2>
              <div className="space-y-2">
                {membre.taches_assignees.map((tache: any, index: number) => (
                  <Link
                    key={index}
                    href={`/taches/${tache._id}`}
                    className="block rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <p className="font-medium">{tache.titre}</p>
                    <p className="text-sm text-gray-500">{tache.statut}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Informations</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Rôle principal</span>
                <p className="font-medium">{membre.role_principal}</p>
              </div>
              {membre.roles_secondaires && membre.roles_secondaires.length > 0 && (
                <div>
                  <span className="text-gray-500">Rôles secondaires</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {membre.roles_secondaires.map((role, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-gray-500">Statut</span>
                <p className="mt-1">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      membre.statut === 'ACTIF'
                        ? 'bg-green-100 text-green-800'
                        : membre.statut === 'EN_CONGE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {membre.statut}
                  </span>
                </p>
              </div>
              {membre.telephone && (
                <div>
                  <span className="text-gray-500">Téléphone</span>
                  <p className="font-medium">{membre.telephone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Dates</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Date d'embauche</span>
                <p className="font-medium">
                  {format(new Date(membre.date_embauche), 'dd MMM yyyy')}
                </p>
              </div>
              {membre.date_depart && (
                <div>
                  <span className="text-gray-500">Date de départ</span>
                  <p className="font-medium">
                    {format(new Date(membre.date_depart), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Disponibilité */}
          {membre.disponibilite_hebdomadaire && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Disponibilité</h2>
              <div className="text-sm">
                <span className="text-gray-500">Hebdomadaire</span>
                <p className="text-2xl font-bold">{membre.disponibilite_hebdomadaire}h</p>
              </div>
            </div>
          )}

          {/* Taux horaire */}
          {membre.taux_horaire && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Taux horaire</h2>
              <div className="text-sm">
                <p className="text-2xl font-bold">{membre.taux_horaire} €/h</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
