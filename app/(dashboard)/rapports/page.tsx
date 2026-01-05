/**
 * Page principale de reporting et KPIs
 */

import { getGlobalKPIsAction, getAvancementStatsAction, getRetardStatsAction, getBudgetStatsAction } from '@/app/actions/reporting';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function RapportsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const kpisResult = await getGlobalKPIsAction();
  const avancementResult = await getAvancementStatsAction();
  const retardResult = await getRetardStatsAction();
  const budgetResult = await getBudgetStatsAction();

  const kpis = kpisResult.success ? kpisResult.kpis : null;
  const avancement = avancementResult.success ? avancementResult.stats : [];
  const retards = retardResult.success ? retardResult.stats : [];
  const budgets = budgetResult.success ? budgetResult.stats : [];

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Rapports & KPIs</h1>

      {/* KPIs Globaux */}
      {kpis && (
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Projets actifs</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{kpis.projets_actifs}</p>
            <p className="mt-1 text-xs text-gray-500">sur {kpis.projets_total} projets</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Projets en retard</h3>
            <p className={`mt-2 text-3xl font-bold ${kpis.projets_en_retard > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {kpis.projets_en_retard}
            </p>
            <p className="mt-1 text-xs text-gray-500">nécessitent une attention</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Tâches terminées</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{kpis.taches_terminees}</p>
            <p className="mt-1 text-xs text-gray-500">sur {kpis.taches_total} tâches</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Budget utilisé</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {kpis.budget_utilise_pourcentage.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {kpis.budget_total_consomme.toFixed(0)} € / {kpis.budget_total_alloue.toFixed(0)} €
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Membres actifs</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{kpis.membres_actifs}</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Heures ce mois</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{kpis.heures_travaillees_mois.toFixed(0)}h</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Tâches en retard</h3>
            <p className={`mt-2 text-3xl font-bold ${kpis.taches_en_retard > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {kpis.taches_en_retard}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Projets terminés</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{kpis.projets_termines}</p>
            <p className="mt-1 text-xs text-gray-500">
              {kpis.projets_total > 0
                ? ((kpis.projets_termines / kpis.projets_total) * 100).toFixed(1)
                : 0}% du total
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Avancement des projets */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Avancement des projets</h2>
          {avancement.length === 0 ? (
            <p className="text-gray-500">Aucun projet</p>
          ) : (
            <div className="space-y-4">
              {avancement.slice(0, 5).map((stat) => (
                <div key={stat.projet_id}>
                  <div className="mb-1 flex items-center justify-between">
                    <Link
                      href={`/projets/${stat.projet_id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {stat.nom_projet}
                    </Link>
                    <span className="text-sm font-medium">{stat.progression_globale.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full ${
                        stat.est_en_retard ? 'bg-red-500' : stat.progression_globale >= 80 ? 'bg-green-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${stat.progression_globale}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {stat.taches_terminees}/{stat.taches_total} tâches • {stat.jalons_atteints}/{stat.jalons_total} jalons
                    </span>
                    {stat.est_en_retard && (
                      <span className="text-red-600">Retard: {stat.retard_jours} jours</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projets en retard */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Projets en retard</h2>
          {retards.length === 0 ? (
            <p className="text-green-600">✅ Aucun projet en retard</p>
          ) : (
            <div className="space-y-4">
              {retards.slice(0, 5).map((stat) => (
                <div key={stat.projet_id} className="rounded-md border border-red-200 bg-red-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Link
                      href={`/projets/${stat.projet_id}`}
                      className="font-medium text-red-800 hover:text-red-900"
                    >
                      {stat.nom_projet}
                    </Link>
                    <span className="text-sm font-bold text-red-600">{stat.retard_jours} jours</span>
                  </div>
                  <div className="text-sm text-red-700">
                    <p>Date prévue: {new Date(stat.date_fin_prevue).toLocaleDateString('fr-FR')}</p>
                    <p className="mt-1">
                      {stat.taches_en_retard}/{stat.taches_total} tâches en retard ({stat.pourcentage_retard.toFixed(0)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget par projet */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Budget par projet</h2>
          {budgets.length === 0 ? (
            <p className="text-gray-500">Aucun projet</p>
          ) : (
            <div className="space-y-4">
              {budgets.slice(0, 5).map((stat) => (
                <div key={stat.projet_id}>
                  <div className="mb-1 flex items-center justify-between">
                    <Link
                      href={`/projets/${stat.projet_id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {stat.nom_projet}
                    </Link>
                    <span className={`text-sm font-medium ${
                      stat.est_depasse ? 'text-red-600' : stat.pourcentage_utilise > 80 ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {stat.pourcentage_utilise.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full ${
                        stat.est_depasse ? 'bg-red-500' : stat.pourcentage_utilise > 80 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(stat.pourcentage_utilise, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {stat.budget_consomme.toFixed(0)} € / {stat.budget_alloue.toFixed(0)} €
                    </span>
                    {stat.est_depasse && (
                      <span className="text-red-600">Dépassé de {Math.abs(stat.budget_restant).toFixed(0)} €</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Résumé */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Résumé</h2>
          <div className="space-y-3 text-sm">
            {kpis && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taux de completion projets</span>
                  <span className="font-medium">
                    {kpis.projets_total > 0
                      ? ((kpis.projets_termines / kpis.projets_total) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taux de completion tâches</span>
                  <span className="font-medium">
                    {kpis.taches_total > 0
                      ? ((kpis.taches_terminees / kpis.taches_total) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Moyenne heures/mois</span>
                  <span className="font-medium">{kpis.heures_travaillees_mois.toFixed(0)}h</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

