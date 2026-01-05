/**
 * API Route pour l'export calendrier (iCal format)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { Projet, Tache } from '@/lib/models';
import connectDB from '@/lib/db/mongodb';
import { format } from 'date-fns';

/**
 * Génère un fichier iCal
 */
function generateICal(events: Array<{
  summary: string;
  description: string;
  start: Date;
  end?: Date;
  location?: string;
}>): string {
  let ical = 'BEGIN:VCALENDAR\r\n';
  ical += 'VERSION:2.0\r\n';
  ical += 'PRODID:-//Gestion de Projets//FR\r\n';
  ical += 'CALSCALE:GREGORIAN\r\n';

  for (const event of events) {
    ical += 'BEGIN:VEVENT\r\n';
    ical += `UID:${Date.now()}-${Math.random().toString(36).substring(7)}\r\n`;
    ical += `DTSTART:${format(event.start, 'yyyyMMdd')}T000000\r\n`;
    if (event.end) {
      ical += `DTEND:${format(event.end, 'yyyyMMdd')}T235959\r\n`;
    }
    ical += `SUMMARY:${event.summary}\r\n`;
    ical += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\r\n`;
    if (event.location) {
      ical += `LOCATION:${event.location}\r\n`;
    }
    ical += 'END:VEVENT\r\n';
  }

  ical += 'END:VCALENDAR\r\n';
  return ical;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all'; // 'projets', 'taches', 'all'
    const projet_id = searchParams.get('projet_id') || undefined;

    await connectDB();

    const events: Array<{
      summary: string;
      description: string;
      start: Date;
      end?: Date;
      location?: string;
    }> = [];

    // Projets
    if (type === 'projets' || type === 'all') {
      const query: any = { est_template: false };
      if (projet_id) {
        query._id = projet_id;
      }

      const projets = await Projet.find(query).lean();
      for (const projet of projets) {
        if (projet.date_debut) {
          events.push({
            summary: `Début: ${projet.nom}`,
            description: projet.description || '',
            start: new Date(projet.date_debut),
          });
        }
        if (projet.date_fin_prevue) {
          events.push({
            summary: `Fin prévue: ${projet.nom}`,
            description: projet.description || '',
            start: new Date(projet.date_fin_prevue),
          });
        }
      }
    }

    // Tâches
    if (type === 'taches' || type === 'all') {
      const query: any = {};
      if (projet_id) {
        query.projet_id = projet_id;
      }

      const taches = await Tache.find(query)
        .populate('projet_id', 'nom')
        .lean();

      for (const tache of taches) {
        if (tache.date_fin_prevue) {
          events.push({
            summary: tache.titre,
            description: `${tache.description || ''}\nProjet: ${typeof tache.projet_id === 'object' && tache.projet_id ? tache.projet_id.nom : ''}`,
            start: new Date(tache.date_fin_prevue),
          });
        }
      }
    }

    const ical = generateICal(events);

    return new NextResponse(ical, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="calendrier_${new Date().toISOString().split('T')[0]}.ics"`,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération du calendrier:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

