/**
 * Page de détail du budget
 */

import { getBudgetStatsAction } from '@/app/actions/reporting';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function BudgetPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const result = await getBudgetStatsAction();

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">Erreur: {result.error}</p>
        </div>
      </div>
    );
  }

  const stats = result.stats;

  // Calculs globaux
  const budget_total_alloue = stats.reduce((sum, s) => sum + s.budget_alloue, 0);
  const budget_total_consomme = stats.reduce((sum, s) => sum + s.budget_consomme, 0);
  const budget_total_restant = budget_total_alloue - budget_total_consomme;
  const projets_depasses = stats.filter(s => s.est_depasse).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Budget par projet</h1>
        <Link
          href="/rapports"
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← Retour aux rapports
        </Link>
      </div>

      {/* Résumé global */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Budget total alloué</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {budget_total_alloue.toFixed(0)} €
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Budget total consommé</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {budget_total_consomme.toFixed(0)} €
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Budget restant</h3>
          <p className={`mt-2 text-2xl font-bold ${budget_total_restant < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {budget_total_restant.toFixed(0)} €
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Projets dépassés</h3>
          <p className={`mt-2 text-2xl font-bold ${projets_depasses > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {projets_depasses}
          </p>
        </div>
      </div>

      {/* Liste des projets */}
      {stats.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Aucun projet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => (
            <div
              key={stat.projet_id}
              className={`rounded-lg p-6 shadow ${
                stat.est_depasse ? 'border-2 border-red-300 bg-red-50' : 'bg-white'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <Link
                  href={`/projets/${stat.projet_id}`}
                  className={`text-xl font-semibold ${
                    stat.est_depasse ? 'text-red-800' : 'text-indigo-600'
                  } hover:underline`}
                >
                  {stat.nom_projet}
                </Link>
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold ${
                    stat.est_depasse ? 'text-red-600' : stat.pourcentage_utilise > 80 ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                    {stat.pourcentage_utilise.toFixed(0)}%
                  </span>
                  {stat.est_depasse && (
                    <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white">
                      Dépassé
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4 h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full ${
                    stat.est_depasse ? 'bg-red-500' : stat.pourcentage_utilise > 80 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stat.pourcentage_utilise, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Alloué</span>
                  <p className="text-lg font-medium">{stat.budget_alloue.toFixed(0)} €</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Consommé</span>
                  <p className="text-lg font-medium">{stat.budget_consomme.toFixed(0)} €</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Restant</span>
                  <p className={`text-lg font-medium ${stat.budget_restant < 0 ? 'text-red-600' : ''}`}>
                    {stat.budget_restant.toFixed(0)} €
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

