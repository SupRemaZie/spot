/**
 * Composant pour afficher et gérer les commentaires
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getCommentairesAction, createCommentaireAction } from '@/app/actions/commentaires';
import { TypeRessource } from '@/lib/types/commentaire.types';

interface Commentaire {
  _id: string;
  contenu: string;
  auteur_id: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  mentions?: Array<{
    _id: string;
    nom: string;
    prenom: string;
  }>;
  createdAt: Date;
  est_edite?: boolean;
  reponse_a?: {
    _id: string;
    contenu: string;
  };
}

export function Commentaires({
  ressourceType,
  ressourceId,
}: {
  ressourceType: TypeRessource;
  ressourceId: string;
}) {
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCommentaires();
  }, [ressourceId]);

  const loadCommentaires = async () => {
    setLoading(true);
    try {
      const result = await getCommentairesAction(ressourceType, ressourceId);
      if (result.success) {
        setCommentaires(result.commentaires as any);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des commentaires:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const result = await createCommentaireAction({
        ressource_type: ressourceType,
        ressource_id: ressourceId,
        contenu: newComment,
      });

      if (result.success) {
        setNewComment('');
        await loadCommentaires();
      } else {
        alert(result.error || 'Erreur lors de la création du commentaire');
      }
    } catch (err) {
      alert('Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Chargement des commentaires...</div>;
  }

  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Commentaires</h2>

      {/* Formulaire de nouveau commentaire */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire... (utilisez @nom pour mentionner quelqu'un)"
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Envoi...' : 'Commenter'}
          </button>
        </div>
      </form>

      {/* Liste des commentaires */}
      {commentaires.length === 0 ? (
        <p className="text-gray-500">Aucun commentaire</p>
      ) : (
        <div className="space-y-4">
          {commentaires.map((commentaire) => (
            <div
              key={commentaire._id}
              className="rounded-md border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {commentaire.auteur_id.prenom} {commentaire.auteur_id.nom}
                    </span>
                    {commentaire.est_edite && (
                      <span className="text-xs text-gray-500">(modifié)</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {format(new Date(commentaire.createdAt), 'dd MMM yyyy à HH:mm')}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700 whitespace-pre-wrap">{commentaire.contenu}</p>
                  {commentaire.mentions && commentaire.mentions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {commentaire.mentions.map((mention) => (
                        <span
                          key={mention._id}
                          className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800"
                        >
                          @{mention.prenom} {mention.nom}
                        </span>
                      ))}
                    </div>
                  )}
                  {commentaire.reponse_a && (
                    <div className="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-600">
                      <span className="font-medium">Réponse à :</span> {commentaire.reponse_a.contenu}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

