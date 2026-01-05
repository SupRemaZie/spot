/**
 * API Route pour l'export des projets
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { exportProjetsCSV, exportToExcel, exportToPDF } from '@/lib/services/export.service';
import { Projet } from '@/lib/models';
import connectDB from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const statut = searchParams.get('statut') || undefined;

    await connectDB();

    const query: any = { est_template: false };
    if (statut) {
      query.statut = statut;
    }

    const projets = await Projet.find(query)
      .populate('chef_projet', 'nom prenom')
      .populate('membres_assignes', 'nom prenom')
      .lean();

    const data = projets.map(projet => ({
      nom: projet.nom,
      description: projet.description || '',
      statut: projet.statut,
      priorite: projet.priorite,
      chef_projet: typeof projet.chef_projet === 'object' && projet.chef_projet
        ? `${projet.chef_projet.prenom} ${projet.chef_projet.nom}`
        : '',
      date_debut: projet.date_debut ? new Date(projet.date_debut).toLocaleDateString('fr-FR') : '',
      date_fin_prevue: projet.date_fin_prevue ? new Date(projet.date_fin_prevue).toLocaleDateString('fr-FR') : '',
      budget_alloue: projet.budget_alloue || 0,
      budget_consomme: projet.budget_consomme || 0,
    }));

    if (format === 'csv') {
      const csv = await exportProjetsCSV({ statut: statut || undefined });
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="projets_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'excel') {
      const buffer = await exportToExcel(data, 'Projets');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="projets_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else if (format === 'pdf') {
      const buffer = await exportToPDF(
        'Liste des projets',
        data,
        [
          { header: 'Nom', dataKey: 'nom', width: 60 },
          { header: 'Statut', dataKey: 'statut', width: 30 },
          { header: 'Priorité', dataKey: 'priorite', width: 30 },
          { header: 'Chef de projet', dataKey: 'chef_projet', width: 50 },
          { header: 'Budget alloué', dataKey: 'budget_alloue', width: 30 },
          { header: 'Budget consommé', dataKey: 'budget_consomme', width: 30 },
        ]
      );
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="projets_${new Date().toISOString().split('T')[0]}.pdf"`,
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

