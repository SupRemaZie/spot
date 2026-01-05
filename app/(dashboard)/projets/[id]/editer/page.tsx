/**
 * Page d'édition d'un projet
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { updateProjetAction, getProjetAction } from '@/app/actions/projets';
import { IProjet, StatutProjet, PrioriteProjet } from '@/lib/types/projet.types';

export default function EditerProjetPage() {
  const router = useRouter();
  const params = useParams();
  const projetId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [projet, setProjet] = useState<IProjet | null>(null);

  useEffect(() => {
    async function loadProjet() {
      const result = await getProjetAction(projetId);
      if (result.success && result.projet) {
        setProjet(result.projet);
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
      setLoading(false);
    }
    loadProjet();
  }, [projetId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateProjetAction(projetId, {
        nom: formData.get('nom') as string,
        description: formData.get('description') as string || undefined,
        statut: formData.get('statut') as StatutProjet,
        priorite: formData.get('priorite') as PrioriteProjet,
        date_debut_prevue: new Date(formData.get('date_debut_prevue') as string),
        date_fin_prevue: new Date(formData.get('date_fin_prevue') as string),
        budget_alloue: parseFloat(formData.get('budget_alloue') as string),
      });

      if (result.success) {
        router.push(`/projets/${projetId}`);
      } else {
        setError(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-800">{error || 'Projet non trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Modifier le projet</h1>

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
                defaultValue={projet.nom}
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
                defaultValue={projet.description}
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
                  defaultValue={projet.statut}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="PLANIFICATION">Planification</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="EN_PAUSE">En pause</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
                  <option value="ARCHIVE">Archivé</option>
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
                  defaultValue={projet.priorite}
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
                  defaultValue={new Date(projet.date_debut_prevue).toISOString().split('T')[0]}
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
                  defaultValue={new Date(projet.date_fin_prevue).toISOString().split('T')[0]}
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
                defaultValue={projet.budget_alloue}
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
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

