/**
 * API Route pour l'export des feuilles de temps
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { exportFeuillesTempsCSV, exportToExcel, exportToPDF } from '@/lib/services/export.service';
import { FeuilleTemps } from '@/lib/models';
import connectDB from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const membre_id = searchParams.get('membre_id') || undefined;
    const projet_id = searchParams.get('projet_id') || undefined;
    const date_debut = searchParams.get('date_debut') ? new Date(searchParams.get('date_debut')!) : undefined;
    const date_fin = searchParams.get('date_fin') ? new Date(searchParams.get('date_fin')!) : undefined;
    const statut = searchParams.get('statut') || undefined;

    await connectDB();

    const query: any = {};
    if (membre_id) {
      query.membre_id = membre_id;
    }
    if (projet_id) {
      query.projet_id = projet_id;
    }
    if (statut) {
      query.statut = statut;
    }
    if (date_debut || date_fin) {
      query.date = {};
      if (date_debut) {
        query.date.$gte = date_debut;
      }
      if (date_fin) {
        query.date.$lte = date_fin;
      }
    }

    const feuillesTemps = await FeuilleTemps.find(query)
      .populate('membre_id', 'nom prenom')
      .populate('projet_id', 'nom')
      .populate('tache_id', 'titre')
      .lean();

    const data = feuillesTemps.map(ft => ({
      date: new Date(ft.date).toLocaleDateString('fr-FR'),
      membre: typeof ft.membre_id === 'object' && ft.membre_id
        ? `${ft.membre_id.prenom} ${ft.membre_id.nom}`
        : '',
      projet: typeof ft.projet_id === 'object' && ft.projet_id ? ft.projet_id.nom : '',
      tache: typeof ft.tache_id === 'object' && ft.tache_id ? ft.tache_id.titre : '',
      heures_travaillees: ft.heures_travaillees,
      statut: ft.statut,
    }));

    if (format === 'csv') {
      const csv = await exportFeuillesTempsCSV({ membre_id, projet_id, date_debut, date_fin, statut });
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="feuilles_temps_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'excel') {
      const buffer = await exportToExcel(data, 'Feuilles de temps');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="feuilles_temps_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else if (format === 'pdf') {
      const buffer = await exportToPDF(
        'Feuilles de temps',
        data,
        [
          { header: 'Date', dataKey: 'date', width: 30 },
          { header: 'Membre', dataKey: 'membre', width: 50 },
          { header: 'Projet', dataKey: 'projet', width: 50 },
          { header: 'Heures', dataKey: 'heures_travaillees', width: 20 },
          { header: 'Statut', dataKey: 'statut', width: 30 },
        ]
      );
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="feuilles_temps_${new Date().toISOString().split('T')[0]}.pdf"`,
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

