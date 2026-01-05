/**
 * Page Dashboard principale
 * Affiche le dashboard approprié selon le rôle de l'utilisateur
 */

import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getDashboardAction } from '@/app/actions/dashboard';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const result = await getDashboardAction();

  if (!result.success || !result.dashboard) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">Erreur: {result.error || 'Impossible de charger le dashboard'}</p>
        </div>
      </div>
    );
  }

  const { dashboard, role } = result;

  // Dashboard Direction (Admin/Directeur)
  if (role === 'ADMIN' || role === 'DIRECTEUR') {
    const dash = dashboard as any;
    return (
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Dashboard Direction</h1>

        {/* Vue globale */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Projets actifs</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{dash.vue_globale.projets_actifs}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Projets en retard</h3>
            <p className={`mt-2 text-3xl font-bold ${dash.vue_globale.projets_en_retard > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {dash.vue_globale.projets_en_retard}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Budget utilisé</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {dash.vue_globale.budget_utilise_pourcentage.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {dash.vue_globale.budget_total_consomme.toFixed(0)} € / {dash.vue_globale.budget_total_alloue.toFixed(0)} €
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Heures ce mois</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {dash.vue_globale.heures_travaillees_mois.toFixed(0)}h
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Projets prioritaires */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Projets prioritaires</h2>
            {dash.projets_prioritaires.length === 0 ? (
              <p className="text-gray-500">Aucun projet prioritaire</p>
            ) : (
              <div className="space-y-3">
                {dash.projets_prioritaires.map((projet: any) => (
                  <Link
                    key={projet._id}
                    href={`/projets/${projet._id}`}
                    className="block rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{projet.nom}</p>
                        <p className="text-sm text-gray-500">
                          {projet.priorite} • {projet.progression.toFixed(0)}% • Budget: {projet.budget_utilise.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Retards critiques */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Retards critiques</h2>
            {dash.retards_critiques.length === 0 ? (
              <p className="text-green-600">✅ Aucun retard critique</p>
            ) : (
              <div className="space-y-3">
                {dash.retards_critiques.map((projet: any) => (
                  <Link
                    key={projet._id}
                    href={`/projets/${projet._id}`}
                    className="block rounded-md border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">{projet.nom}</p>
                        <p className="text-sm text-red-700">
                          Retard: {projet.retard_jours} jours
                          {projet.budget_depasse && ' • Budget dépassé'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance membres */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Performance des membres</h2>
          {dash.performance_membres.length === 0 ? (
            <p className="text-gray-500">Aucun membre</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dash.performance_membres.map((membre: any) => (
                <Link
                  key={membre._id}
                  href={`/membres/${membre._id}`}
                  className="rounded-md border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <p className="font-medium">{membre.nom}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Completion</span>
                    <span className="font-medium">{membre.taux_completion.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Heures</span>
                    <span className="font-medium">{membre.heures_travaillees.toFixed(0)}h</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard Chef de projet
  if (role === 'CHEF_PROJET') {
    const dash = dashboard as any;
    return (
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Dashboard Chef de projet</h1>

        {/* Alertes */}
        {dash.alertes && dash.alertes.length > 0 && (
          <div className="mb-6 space-y-2">
            {dash.alertes.map((alerte: any, index: number) => (
              <div
                key={index}
                className={`rounded-md p-4 ${
                  alerte.type === 'RETARD'
                    ? 'bg-red-50 text-red-800'
                    : alerte.type === 'BUDGET'
                    ? 'bg-orange-50 text-orange-800'
                    : 'bg-yellow-50 text-yellow-800'
                }`}
              >
                <p className="font-medium">{alerte.message}</p>
                {alerte.projet_id && (
                  <Link
                    href={`/projets/${alerte.projet_id}`}
                    className="mt-1 text-sm underline"
                  >
                    Voir le projet →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions rapides */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Feuilles de temps à valider</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{dash.feuilles_temps_a_valider}</p>
            <Link
              href="/feuilles-temps?statut=SOUMISE"
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              Voir toutes →
            </Link>
          </div>
        </div>

        {/* Mes projets */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Mes projets</h2>
          {dash.mes_projets.length === 0 ? (
            <p className="text-gray-500">Aucun projet</p>
          ) : (
            <div className="space-y-4">
              {dash.mes_projets.map((projet: any) => (
                <Link
                  key={projet._id}
                  href={`/projets/${projet._id}`}
                  className="block rounded-md border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{projet.nom}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        projet.est_en_retard
                          ? 'bg-red-100 text-red-800'
                          : projet.statut === 'EN_COURS'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {projet.statut}
                    </span>
                  </div>
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full ${
                        projet.est_en_retard ? 'bg-red-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${projet.progression}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {projet.taches_terminees}/{projet.taches_total} tâches • {projet.progression.toFixed(0)}%
                    </span>
                    <span>
                      Budget: {projet.budget_utilise.toFixed(0)}% • {projet.jours_restants} jours restants
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard Membre
  const dash = dashboard as any;
  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Mon Dashboard</h1>

      {/* Statistiques rapides */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Tâches en cours</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{dash.taches_en_cours}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Tâches terminées</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{dash.taches_terminees}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Heures ce mois</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{dash.heures_ce_mois.toFixed(0)}h</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Heures cette semaine</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{dash.heures_semaine.toFixed(0)}h</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mes tâches */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Mes tâches</h2>
          {dash.mes_taches.length === 0 ? (
            <p className="text-gray-500">Aucune tâche assignée</p>
          ) : (
            <div className="space-y-3">
              {dash.mes_taches.map((tache: any) => (
                <Link
                  key={tache._id}
                  href={`/taches/${tache._id}`}
                  className={`block rounded-md border p-3 transition-colors ${
                    tache.est_en_retard
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{tache.titre}</p>
                      <p className="text-sm text-gray-500">{tache.projet}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span
                          className={`rounded-full px-2 py-1 ${
                            tache.statut === 'TERMINEE'
                              ? 'bg-green-100 text-green-800'
                              : tache.statut === 'EN_COURS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tache.statut}
                        </span>
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
                        {tache.progression > 0 && (
                          <span>Progression: {tache.progression}%</span>
                        )}
                      </div>
                    </div>
                    {tache.est_en_retard && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Retard
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Prochaines échéances */}
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Prochaines échéances</h2>
            {dash.prochaines_echeances.length === 0 ? (
              <p className="text-gray-500">Aucune échéance à venir</p>
            ) : (
              <div className="space-y-3">
                {dash.prochaines_echeances.map((echeance: any) => (
                  <Link
                    key={echeance.tache_id}
                    href={`/taches/${echeance.tache_id}`}
                    className="block rounded-md border border-yellow-200 bg-yellow-50 p-3 transition-colors hover:bg-yellow-100"
                  >
                    <p className="font-medium">{echeance.titre}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {format(new Date(echeance.date_fin_prevue), 'dd MMM yyyy')} • {echeance.jours_restants} jours restants
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mes projets */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Mes projets</h2>
            {dash.mes_projets.length === 0 ? (
              <p className="text-gray-500">Aucun projet assigné</p>
            ) : (
              <div className="space-y-2">
                {dash.mes_projets.map((projet: any) => (
                  <Link
                    key={projet._id}
                    href={`/projets/${projet.projet_id || projet._id}`}
                    className="block rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <p className="font-medium">{projet.nom}</p>
                    <p className="text-sm text-gray-500">{projet.statut}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
