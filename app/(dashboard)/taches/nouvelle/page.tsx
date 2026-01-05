/**
 * Page de création d'une nouvelle tâche
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createTacheAction } from '@/app/actions/taches';
import { StatutTache, PrioriteTache } from '@/lib/types/tache.types';

export default function NouvelleTachePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projetId = searchParams.get('projet_id') || '';
  const tacheParentId = searchParams.get('tache_parent_id') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createTacheAction({
        titre: formData.get('titre') as string,
        description: formData.get('description') as string || undefined,
        projet_id: formData.get('projet_id') as string,
        tache_parent_id: formData.get('tache_parent_id')?.toString() || undefined,
        statut: (formData.get('statut') as StatutTache) || 'A_FAIRE',
        priorite: (formData.get('priorite') as PrioriteTache) || 'NORMALE',
        assignes: formData.get('assignes')?.toString().split(',').filter(Boolean) || [],
        charge_estimee: formData.get('charge_estimee') ? parseFloat(formData.get('charge_estimee') as string) : undefined,
        date_debut_prevue: formData.get('date_debut_prevue') ? new Date(formData.get('date_debut_prevue') as string) : undefined,
        date_fin_prevue: formData.get('date_fin_prevue') ? new Date(formData.get('date_fin_prevue') as string) : undefined,
        dependances: formData.get('dependances')?.toString().split(',').filter(Boolean) || [],
        tags: formData.get('tags')?.toString().split(',').filter(Boolean) || [],
      });

      if (result.success && result.tache) {
        router.push(`/taches/${result.tache._id}`);
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
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Nouvelle tâche</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Informations générales</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="titre" className="block text-sm font-medium text-gray-700">
                Titre *
              </label>
              <input
                type="text"
                id="titre"
                name="titre"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <label htmlFor="tache_parent_id" className="block text-sm font-medium text-gray-700">
                  Tâche parent (ID) - Optionnel
                </label>
                <input
                  type="text"
                  id="tache_parent_id"
                  name="tache_parent_id"
                  defaultValue={tacheParentId}
                  placeholder="ID de la tâche parent"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="statut" className="block text-sm font-medium text-gray-700">
                  Statut *
                </label>
                <select
                  id="statut"
                  name="statut"
                  required
                  defaultValue="A_FAIRE"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="A_FAIRE">À faire</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="EN_PAUSE">En pause</option>
                  <option value="EN_REVUE">En revue</option>
                  <option value="TERMINEE">Terminée</option>
                  <option value="ANNULEE">Annulée</option>
                </select>
              </div>

              <div>
                <label htmlFor="priorite" className="block text-sm font-medium text-gray-700">
                  Priorité *
                </label>
                <select
                  id="priorite"
                  name="priorite"
                  required
                  defaultValue="NORMALE"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="FAIBLE">Faible</option>
                  <option value="NORMALE">Normale</option>
                  <option value="ELEVEE">Élevée</option>
                  <option value="CRITIQUE">Critique</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="charge_estimee" className="block text-sm font-medium text-gray-700">
                  Charge estimée (heures)
                </label>
                <input
                  type="number"
                  id="charge_estimee"
                  name="charge_estimee"
                  min="0"
                  step="0.5"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="progression" className="block text-sm font-medium text-gray-700">
                  Progression (%)
                </label>
                <input
                  type="number"
                  id="progression"
                  name="progression"
                  min="0"
                  max="100"
                  defaultValue="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date_debut_prevue" className="block text-sm font-medium text-gray-700">
                  Date de début prévue
                </label>
                <input
                  type="date"
                  id="date_debut_prevue"
                  name="date_debut_prevue"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="date_fin_prevue" className="block text-sm font-medium text-gray-700">
                  Date de fin prévue
                </label>
                <input
                  type="date"
                  id="date_fin_prevue"
                  name="date_fin_prevue"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="assignes" className="block text-sm font-medium text-gray-700">
                Membres assignés (IDs séparés par des virgules)
              </label>
              <input
                type="text"
                id="assignes"
                name="assignes"
                placeholder="id1,id2,id3"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="dependances" className="block text-sm font-medium text-gray-700">
                Dépendances (IDs de tâches séparés par des virgules)
              </label>
              <input
                type="text"
                id="dependances"
                name="dependances"
                placeholder="id1,id2,id3"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                placeholder="tag1,tag2,tag3"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
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
            {loading ? 'Création...' : 'Créer la tâche'}
          </button>
        </div>
      </form>
    </div>
  );
}

