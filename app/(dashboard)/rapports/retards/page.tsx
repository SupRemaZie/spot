/**
 * Page de détail des retards
 */

import { getRetardStatsAction } from '@/app/actions/reporting';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function RetardsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const result = await getRetardStatsAction();

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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Projets en retard</h1>
        <Link
          href="/rapports"
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← Retour aux rapports
        </Link>
      </div>

      {stats.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-green-600 text-lg">✅ Aucun projet en retard</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.projet_id} className="rounded-lg border-2 border-red-300 bg-red-50 p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <Link
                  href={`/projets/${stat.projet_id}`}
                  className="text-xl font-semibold text-red-800 hover:text-red-900"
                >
                  {stat.nom_projet}
                </Link>
                <span className="rounded-full bg-red-600 px-4 py-2 text-lg font-bold text-white">
                  {stat.retard_jours} jours
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <span className="text-sm font-medium text-red-700">Date de fin prévue</span>
                  <p className="mt-1 text-lg font-medium text-red-900">
                    {format(new Date(stat.date_fin_prevue), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-red-700">Tâches en retard</span>
                  <p className="mt-1 text-lg font-medium text-red-900">
                    {stat.taches_en_retard} / {stat.taches_total} ({stat.pourcentage_retard.toFixed(0)}%)
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-red-700">Pourcentage de retard</span>
                  <p className="mt-1 text-lg font-medium text-red-900">
                    {stat.pourcentage_retard.toFixed(1)}%
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

