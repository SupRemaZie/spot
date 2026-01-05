/**
 * Page d'export de données
 */

import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ExportsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Exports</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Export Projets */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Projets</h2>
          <p className="mb-4 text-sm text-gray-600">
            Exportez la liste des projets dans différents formats
          </p>
          <div className="space-y-2">
            <a
              href="/api/export/projets?format=csv"
              className="block w-full rounded-md bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
            >
              Export CSV
            </a>
            <a
              href="/api/export/projets?format=excel"
              className="block w-full rounded-md bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
            >
              Export Excel
            </a>
            <a
              href="/api/export/projets?format=pdf"
              className="block w-full rounded-md bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
            >
              Export PDF
            </a>
          </div>
        </div>

        {/* Export Tâches */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Tâches</h2>
          <p className="mb-4 text-sm text-gray-600">
            Exportez la liste des tâches dans différents formats
          </p>
          <div className="space-y-2">
            <a
              href="/api/export/taches?format=csv"
              className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              Export CSV
            </a>
            <a
              href="/api/export/taches?format=excel"
              className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              Export Excel
            </a>
            <a
              href="/api/export/taches?format=pdf"
              className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              Export PDF
            </a>
          </div>
        </div>

        {/* Export Feuilles de temps */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Feuilles de temps</h2>
          <p className="mb-4 text-sm text-gray-600">
            Exportez les feuilles de temps dans différents formats
          </p>
          <div className="space-y-2">
            <a
              href="/api/export/feuilles-temps?format=csv"
              className="block w-full rounded-md bg-purple-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-purple-700"
            >
              Export CSV
            </a>
            <a
              href="/api/export/feuilles-temps?format=excel"
              className="block w-full rounded-md bg-purple-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-purple-700"
            >
              Export Excel
            </a>
            <a
              href="/api/export/feuilles-temps?format=pdf"
              className="block w-full rounded-md bg-purple-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-purple-700"
            >
              Export PDF
            </a>
          </div>
        </div>

        {/* Export Calendrier */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Calendrier</h2>
          <p className="mb-4 text-sm text-gray-600">
            Exportez les projets et tâches au format iCal
          </p>
          <div className="space-y-2">
            <a
              href="/api/calendrier?type=all"
              className="block w-full rounded-md bg-orange-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-orange-700"
            >
              Tous (Projets + Tâches)
            </a>
            <a
              href="/api/calendrier?type=projets"
              className="block w-full rounded-md bg-orange-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-orange-700"
            >
              Projets uniquement
            </a>
            <a
              href="/api/calendrier?type=taches"
              className="block w-full rounded-md bg-orange-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-orange-700"
            >
              Tâches uniquement
            </a>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-900">Informations</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-blue-800">
          <li>Les exports CSV peuvent être ouverts dans Excel, Google Sheets, etc.</li>
          <li>Les exports Excel sont au format .xlsx</li>
          <li>Les exports PDF sont optimisés pour l'impression</li>
          <li>Le calendrier iCal peut être importé dans Google Calendar, Outlook, etc.</li>
        </ul>
      </div>
    </div>
  );
}

