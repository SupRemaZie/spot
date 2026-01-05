/**
 * Page de détail de l'avancement des projets
 */

import { getAvancementStatsAction } from '@/app/actions/reporting';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AvancementPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const result = await getAvancementStatsAction();

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
        <h1 className="text-3xl font-bold text-gray-900">Avancement des projets</h1>
        <Link
          href="/rapports"
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← Retour aux rapports
        </Link>
      </div>

      {stats.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Aucun projet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.projet_id} className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <Link
                  href={`/projets/${stat.projet_id}`}
                  className="text-xl font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {stat.nom_projet}
                </Link>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">{stat.progression_globale.toFixed(0)}%</span>
                  {stat.est_en_retard && (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                      Retard: {stat.retard_jours} jours
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4 h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full ${
                    stat.est_en_retard ? 'bg-red-500' : stat.progression_globale >= 80 ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${stat.progression_globale}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <span className="text-sm text-gray-500">Tâches</span>
                  <p className="text-lg font-medium">
                    {stat.taches_terminees} / {stat.taches_total}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Jalons</span>
                  <p className="text-lg font-medium">
                    {stat.jalons_atteints} / {stat.jalons_total}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Jours restants</span>
                  <p className="text-lg font-medium">{stat.jours_restants}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Progression</span>
                  <p className="text-lg font-medium">{stat.progression_globale.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

