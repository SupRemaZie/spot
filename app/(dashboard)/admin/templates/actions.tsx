/**
 * Actions pour les templates
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTemplateFromProjetAction } from '@/app/actions/admin';

export function CreateTemplateForm({ projets }: { projets: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedProjet, setSelectedProjet] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjet) return;

    setLoading(true);
    try {
      const result = await createTemplateFromProjetAction(selectedProjet);
      if (result.success) {
        router.refresh();
        setSelectedProjet('');
      } else {
        alert(result.error || 'Erreur lors de la création du template');
      }
    } catch (err) {
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <select
        value={selectedProjet}
        onChange={(e) => setSelectedProjet(e.target.value)}
        required
        className="flex-1 rounded-md border border-gray-300 px-3 py-2"
      >
        <option value="">Sélectionner un projet...</option>
        {projets.map((projet) => (
          <option key={projet._id?.toString()} value={projet._id?.toString()}>
            {projet.nom}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || !selectedProjet}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Création...' : 'Créer le template'}
      </button>
    </form>
  );
}

