/**
 * Page de gestion des templates
 */

import { getTemplatesAction, createTemplateFromProjetAction } from '@/app/actions/admin';
import { getProjetsAction } from '@/app/actions/projets';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreateTemplateForm } from './actions';

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role_principal !== 'ADMIN') {
    redirect('/dashboard');
  }

  const templatesResult = await getTemplatesAction();
  const projetsResult = await getProjetsAction({ page: 1, limit: 100 });

  const templates = templatesResult.success ? templatesResult.templates : [];
  const projets = projetsResult.success ? projetsResult.projets : [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Templates de projets</h1>
        <Link
          href="/admin"
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← Retour à l'administration
        </Link>
      </div>

      {/* Créer un template */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Créer un template</h2>
        <p className="mb-4 text-sm text-gray-600">
          Sélectionnez un projet existant pour en créer un template
        </p>
        <CreateTemplateForm projets={projets} />
      </div>

      {/* Liste des templates */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Templates disponibles</h2>
        {templates.length === 0 ? (
          <p className="text-gray-500">Aucun template</p>
        ) : (
          <div className="space-y-4">
            {templates.map((template: any) => (
              <div
                key={template._id.toString()}
                className="rounded-md border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{template.nom}</h3>
                    <p className="mt-1 text-sm text-gray-600">{template.description || 'Pas de description'}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>Priorité: {template.priorite}</span>
                      <span>Budget: {template.budget_alloue || 0} €</span>
                    </div>
                  </div>
                  <Link
                    href={`/projets/nouveau?template=${template._id}`}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Utiliser ce template
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

