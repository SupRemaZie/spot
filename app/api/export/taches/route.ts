/**
 * API Route pour l'export des tâches
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { exportTachesCSV, exportToExcel, exportToPDF } from '@/lib/services/export.service';
import { Tache } from '@/lib/models';
import connectDB from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const projet_id = searchParams.get('projet_id') || undefined;
    const statut = searchParams.get('statut') || undefined;

    await connectDB();

    const query: any = {};
    if (projet_id) {
      query.projet_id = projet_id;
    }
    if (statut) {
      query.statut = statut;
    }

    const taches = await Tache.find(query)
      .populate('projet_id', 'nom')
      .populate('assignes', 'nom prenom')
      .lean();

    const data = taches.map(tache => ({
      titre: tache.titre,
      description: tache.description || '',
      projet: typeof tache.projet_id === 'object' && tache.projet_id ? tache.projet_id.nom : '',
      statut: tache.statut,
      priorite: tache.priorite,
      date_fin_prevue: tache.date_fin_prevue ? new Date(tache.date_fin_prevue).toLocaleDateString('fr-FR') : '',
      charge_estimee: tache.charge_estimee || 0,
      charge_reelle: tache.charge_reelle || 0,
      progression: tache.progression || 0,
    }));

    if (format === 'csv') {
      const csv = await exportTachesCSV({ projet_id, statut });
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="taches_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'excel') {
      const buffer = await exportToExcel(data, 'Tâches');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="taches_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else if (format === 'pdf') {
      const buffer = await exportToPDF(
        'Liste des tâches',
        data,
        [
          { header: 'Titre', dataKey: 'titre', width: 60 },
          { header: 'Projet', dataKey: 'projet', width: 40 },
          { header: 'Statut', dataKey: 'statut', width: 30 },
          { header: 'Priorité', dataKey: 'priorite', width: 30 },
          { header: 'Progression', dataKey: 'progression', width: 30 },
        ]
      );
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="taches_${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: 'Format non supporté' }, { status: 400 });
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

