/**
 * Page de saisie d'une nouvelle feuille de temps
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createFeuilleTempsAction } from '@/app/actions/feuilles-temps';
import { StatutFeuilleTemps } from '@/lib/types/feuille-temps.types';

export default function NouvelleFeuilleTempsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const membreId = searchParams.get('membre_id') || '';
  const projetId = searchParams.get('projet_id') || '';
  const tacheId = searchParams.get('tache_id') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createFeuilleTempsAction({
        membre_id: formData.get('membre_id') as string,
        projet_id: formData.get('projet_id') as string,
        tache_id: formData.get('tache_id')?.toString() || undefined,
        date: new Date(formData.get('date') as string),
        heures_travaillees: parseFloat(formData.get('heures_travaillees') as string),
        description: formData.get('description')?.toString() || undefined,
        statut: (formData.get('statut') as StatutFeuilleTemps) || 'BROUILLON',
      });

      if (result.success && result.feuilleTemps) {
        router.push(`/feuilles-temps/${result.feuilleTemps._id}`);
      } else {
        setError(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Nouvelle feuille de temps</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Informations</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="membre_id" className="block text-sm font-medium text-gray-700">
                Membre (ID) *
              </label>
              <input
                type="text"
                id="membre_id"
                name="membre_id"
                required
                defaultValue={membreId}
                placeholder="ID du membre"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="projet_id" className="block text-sm font-medium text-gray-700">
                Projet (ID) *
              </label>
              <input
                type="text"
                id="projet_id"
                name="projet_id"
                required
                defaultValue={projetId}
                placeholder="ID du projet"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="tache_id" className="block text-sm font-medium text-gray-700">
                Tâche (ID) - Optionnel
              </label>
              <input
                type="text"
                id="tache_id"
                name="tache_id"
                defaultValue={tacheId}
                placeholder="ID de la tâche"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="heures_travaillees" className="block text-sm font-medium text-gray-700">
                  Heures travaillées *
                </label>
                <input
                  type="number"
                  id="heures_travaillees"
                  name="heures_travaillees"
                  required
                  min="0.25"
                  max="24"
                  step="0.25"
                  placeholder="0.25"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Description du travail effectué..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="statut" className="block text-sm font-medium text-gray-700">
                Statut *
              </label>
              <select
                id="statut"
                name="statut"
                required
                defaultValue="BROUILLON"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="SOUMISE">Soumise</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer la feuille de temps'}
          </button>
        </div>
      </form>
    </div>
  );
}

