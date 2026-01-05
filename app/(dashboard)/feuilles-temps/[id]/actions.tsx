/**
 * Actions pour valider/rejeter une feuille de temps
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateFeuilleTempsAction, rejectFeuilleTempsAction } from '@/app/actions/feuilles-temps';

export function ValiderFeuilleTemps({ feuilleTempsId }: { feuilleTempsId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [commentaire, setCommentaire] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await validateFeuilleTempsAction(feuilleTempsId, commentaire || undefined);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Erreur lors de la validation');
      }
    } catch (err) {
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="commentaire_validation" className="block text-sm font-medium text-gray-700">
          Commentaire (optionnel)
        </label>
        <textarea
          id="commentaire_validation"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Validation...' : 'Valider'}
      </button>
    </form>
  );
}

export function RejeterFeuilleTemps({ feuilleTempsId }: { feuilleTempsId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [commentaire, setCommentaire] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentaire.trim()) {
      alert('Un commentaire est requis pour rejeter une feuille de temps');
      return;
    }
    setLoading(true);

    try {
      const result = await rejectFeuilleTempsAction(feuilleTempsId, commentaire);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Erreur lors du rejet');
      }
    } catch (err) {
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Rejeter
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="commentaire_rejet" className="block text-sm font-medium text-gray-700">
          Commentaire (requis) *
        </label>
        <textarea
          id="commentaire_rejet"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          required
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setCommentaire('');
          }}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Rejet...' : 'Rejeter'}
        </button>
      </div>
    </form>
  );
}

