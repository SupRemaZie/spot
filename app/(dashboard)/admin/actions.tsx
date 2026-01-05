/**
 * Actions pour l'administration
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cleanupOldDataAction } from '@/app/actions/admin';

export function CleanupButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    notifications_supprimees: number;
    audit_logs_supprimes: number;
  } | null>(null);

  const handleCleanup = async () => {
    if (!confirm('Voulez-vous nettoyer les anciennes données ?\n\nCela supprimera :\n- Notifications archivées de plus de 90 jours\n- Logs d\'audit de plus de 365 jours')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await cleanupOldDataAction({
        notifications_plus_anciennes_jours: 90,
        audit_logs_plus_anciens_jours: 365,
      });

      if (response.success) {
        setResult({
          notifications_supprimees: response.notifications_supprimees || 0,
          audit_logs_supprimes: response.audit_logs_supprimes || 0,
        });
        router.refresh();
      } else {
        alert(response.error || 'Erreur lors du nettoyage');
      }
    } catch (err) {
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCleanup}
        disabled={loading}
        className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? 'Nettoyage...' : 'Nettoyer les anciennes données'}
      </button>
      {result && (
        <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-800">
          <p>✅ Nettoyage terminé :</p>
          <p>{result.notifications_supprimees} notifications supprimées</p>
          <p>{result.audit_logs_supprimes} logs d'audit supprimés</p>
        </div>
      )}
    </div>
  );
}

