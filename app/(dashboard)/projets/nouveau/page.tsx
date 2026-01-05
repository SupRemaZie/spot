/**
 * Page de création d'un nouveau projet
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProjetAction } from '@/app/actions/projets';
import { StatutProjet, PrioriteProjet } from '@/lib/types/projet.types';

export default function NouveauProjetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createProjetAction({
        nom: formData.get('nom') as string,
        description: formData.get('description') as string || undefined,
        statut: (formData.get('statut') as StatutProjet) || 'PLANIFICATION',
        priorite: (formData.get('priorite') as PrioriteProjet) || 'NORMALE',
        date_debut_prevue: new Date(formData.get('date_debut_prevue') as string),
        date_fin_prevue: new Date(formData.get('date_fin_prevue') as string),
        budget_alloue: parseFloat(formData.get('budget_alloue') as string),
        chef_projet: formData.get('chef_projet') as string,
        membres_assignes: formData.get('membres_assignes')?.toString().split(',').filter(Boolean) || [],
        tags: formData.get('tags')?.toString().split(',').filter(Boolean) || [],
      });

      if (result.success && result.projet) {
        router.push(`/projets/${result.projet._id}`);
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
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Nouveau projet</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Informations générales</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                Nom du projet *
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
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
                <label htmlFor="statut" className="block text-sm font-medium text-gray-700">
                  Statut *
                </label>
                <select
                  id="statut"
                  name="statut"
                  required
                  defaultValue="PLANIFICATION"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="PLANIFICATION">Planification</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="EN_PAUSE">En pause</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
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
                <label htmlFor="date_debut_prevue" className="block text-sm font-medium text-gray-700">
                  Date de début prévue *
                </label>
                <input
                  type="date"
                  id="date_debut_prevue"
                  name="date_debut_prevue"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="date_fin_prevue" className="block text-sm font-medium text-gray-700">
                  Date de fin prévue *
                </label>
                <input
                  type="date"
                  id="date_fin_prevue"
                  name="date_fin_prevue"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="budget_alloue" className="block text-sm font-medium text-gray-700">
                Budget alloué (€) *
              </label>
              <input
                type="number"
                id="budget_alloue"
                name="budget_alloue"
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="chef_projet" className="block text-sm font-medium text-gray-700">
                Chef de projet (ID) *
              </label>
              <input
                type="text"
                id="chef_projet"
                name="chef_projet"
                required
                placeholder="ID du membre"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="membres_assignes" className="block text-sm font-medium text-gray-700">
                Membres assignés (IDs séparés par des virgules)
              </label>
              <input
                type="text"
                id="membres_assignes"
                name="membres_assignes"
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
            {loading ? 'Création...' : 'Créer le projet'}
          </button>
        </div>
      </form>
    </div>
  );
}

