/**
 * Page de détail d'une feuille de temps
 */

import { getFeuilleTempsAction } from '@/app/actions/feuilles-temps';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ValiderFeuilleTemps, RejeterFeuilleTemps } from './actions';

export default async function FeuilleTempsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const result = await getFeuilleTempsAction(params.id);

  if (!result.success || !result.feuilleTemps) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">Erreur: {result.error || 'Feuille de temps non trouvée'}</p>
        </div>
      </div>
    );
  }

  const feuilleTemps = result.feuilleTemps;
  const canValidate = feuilleTemps.statut === 'SOUMISE' || feuilleTemps.statut === 'BROUILLON';
  const canEdit = feuilleTemps.statut !== 'VALIDEE';

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/feuilles-temps"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Retour à la liste
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Feuille de temps</h1>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link
              href={`/feuilles-temps/${params.id}/editer`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Modifier
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Informations</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Membre</span>
                <p className="mt-1 text-lg font-medium">
                  {typeof feuilleTemps.membre_id === 'object' && feuilleTemps.membre_id
                    ? `${feuilleTemps.membre_id.prenom} ${feuilleTemps.membre_id.nom}`
                    : 'Membre'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Projet</span>
                <p className="mt-1 text-lg font-medium">
                  {typeof feuilleTemps.projet_id === 'object' && feuilleTemps.projet_id ? (
                    <Link
                      href={`/projets/${feuilleTemps.projet_id._id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {feuilleTemps.projet_id.nom}
                    </Link>
                  ) : (
                    'Projet'
                  )}
                </p>
              </div>
              {typeof feuilleTemps.tache_id === 'object' && feuilleTemps.tache_id && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Tâche</span>
                  <p className="mt-1 text-lg font-medium">
                    <Link
                      href={`/taches/${feuilleTemps.tache_id._id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {feuilleTemps.tache_id.titre}
                    </Link>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Date</span>
                  <p className="mt-1 text-lg font-medium">
                    {format(new Date(feuilleTemps.date), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Heures travaillées</span>
                  <p className="mt-1 text-2xl font-bold">{feuilleTemps.heures_travaillees}h</p>
                </div>
              </div>
              {feuilleTemps.description && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Description</span>
                  <p className="mt-1 text-gray-700">{feuilleTemps.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Validation */}
          {feuilleTemps.statut === 'VALIDEE' || feuilleTemps.statut === 'REJETEE' ? (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Validation</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Statut</span>
                  <p className="mt-1">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        feuilleTemps.statut === 'VALIDEE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {feuilleTemps.statut}
                    </span>
                  </p>
                </div>
                {typeof feuilleTemps.valide_par === 'object' && feuilleTemps.valide_par && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Validé par</span>
                    <p className="mt-1">
                      {feuilleTemps.valide_par.prenom} {feuilleTemps.valide_par.nom}
                    </p>
                  </div>
                )}
                {feuilleTemps.valide_le && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date de validation</span>
                    <p className="mt-1">
                      {format(new Date(feuilleTemps.valide_le), 'dd MMM yyyy à HH:mm')}
                    </p>
                  </div>
                )}
                {feuilleTemps.commentaire_validation && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Commentaire</span>
                    <p className="mt-1 text-gray-700">{feuilleTemps.commentaire_validation}</p>
                  </div>
                )}
              </div>
            </div>
          ) : canValidate ? (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Actions</h2>
              <div className="space-y-4">
                <ValiderFeuilleTemps feuilleTempsId={params.id} />
                <RejeterFeuilleTemps feuilleTempsId={params.id} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Statut</h2>
            <div>
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                  feuilleTemps.statut === 'VALIDEE'
                    ? 'bg-green-100 text-green-800'
                    : feuilleTemps.statut === 'SOUMISE'
                    ? 'bg-yellow-100 text-yellow-800'
                    : feuilleTemps.statut === 'REJETEE'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {feuilleTemps.statut}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

