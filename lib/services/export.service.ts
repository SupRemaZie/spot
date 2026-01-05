/**
 * Service d'export de données
 * Export PDF, Excel, CSV
 */

import connectDB from '../db/mongodb';
import { Projet, Tache, FeuilleTemps, Membre } from '../models';
import { format } from 'date-fns';

/**
 * Export CSV simple
 */
export function exportToCSV(data: Array<Record<string, any>>, headers: string[]): string {
  const csvRows: string[] = [];

  // Headers
  csvRows.push(headers.join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (value === null || value === undefined) return '';
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Export des projets en CSV
 */
export async function exportProjetsCSV(filters: {
  statut?: string;
  date_debut?: Date;
  date_fin?: Date;
} = {}): Promise<string> {
  await connectDB();

  const query: any = { est_template: false };
  if (filters.statut) {
    query.statut = filters.statut;
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
    date_debut: projet.date_debut ? format(new Date(projet.date_debut), 'dd/MM/yyyy') : '',
    date_fin_prevue: projet.date_fin_prevue ? format(new Date(projet.date_fin_prevue), 'dd/MM/yyyy') : '',
    budget_alloue: projet.budget_alloue || 0,
    budget_consomme: projet.budget_consomme || 0,
    membres: typeof projet.membres_assignes === 'object' && Array.isArray(projet.membres_assignes)
      ? projet.membres_assignes.map((m: any) => `${m.prenom} ${m.nom}`).join('; ')
      : '',
  }));

  const headers = [
    'Nom',
    'Description',
    'Statut',
    'Priorité',
    'Chef de projet',
    'Date début',
    'Date fin prévue',
    'Budget alloué',
    'Budget consommé',
    'Membres',
  ];

  return exportToCSV(data, headers);
}

/**
 * Export des tâches en CSV
 */
export async function exportTachesCSV(filters: {
  projet_id?: string;
  statut?: string;
  assigne?: string;
} = {}): Promise<string> {
  await connectDB();

  const query: any = {};
  if (filters.projet_id) {
    query.projet_id = filters.projet_id;
  }
  if (filters.statut) {
    query.statut = filters.statut;
  }
  if (filters.assigne) {
    query.assignes = filters.assigne;
  }

  const taches = await Tache.find(query)
    .populate('projet_id', 'nom')
    .populate('assignes', 'nom prenom')
    .populate('createur_id', 'nom prenom')
    .lean();

  const data = taches.map(tache => ({
    titre: tache.titre,
    description: tache.description || '',
    projet: typeof tache.projet_id === 'object' && tache.projet_id ? tache.projet_id.nom : '',
    statut: tache.statut,
    priorite: tache.priorite,
    createur: typeof tache.createur_id === 'object' && tache.createur_id
      ? `${tache.createur_id.prenom} ${tache.createur_id.nom}`
      : '',
    assignes: typeof tache.assignes === 'object' && Array.isArray(tache.assignes)
      ? tache.assignes.map((m: any) => `${m.prenom} ${m.nom}`).join('; ')
      : '',
    date_debut: tache.date_debut ? format(new Date(tache.date_debut), 'dd/MM/yyyy') : '',
    date_fin_prevue: tache.date_fin_prevue ? format(new Date(tache.date_fin_prevue), 'dd/MM/yyyy') : '',
    charge_estimee: tache.charge_estimee || 0,
    charge_reelle: tache.charge_reelle || 0,
    progression: tache.progression || 0,
  }));

  const headers = [
    'Titre',
    'Description',
    'Projet',
    'Statut',
    'Priorité',
    'Créateur',
    'Assignés',
    'Date début',
    'Date fin prévue',
    'Charge estimée',
    'Charge réelle',
    'Progression',
  ];

  return exportToCSV(data, headers);
}

/**
 * Export des feuilles de temps en CSV
 */
export async function exportFeuillesTempsCSV(filters: {
  membre_id?: string;
  projet_id?: string;
  date_debut?: Date;
  date_fin?: Date;
  statut?: string;
} = {}): Promise<string> {
  await connectDB();

  const query: any = {};
  if (filters.membre_id) {
    query.membre_id = filters.membre_id;
  }
  if (filters.projet_id) {
    query.projet_id = filters.projet_id;
  }
  if (filters.statut) {
    query.statut = filters.statut;
  }
  if (filters.date_debut || filters.date_fin) {
    query.date = {};
    if (filters.date_debut) {
      query.date.$gte = filters.date_debut;
    }
    if (filters.date_fin) {
      query.date.$lte = filters.date_fin;
    }
  }

  const feuillesTemps = await FeuilleTemps.find(query)
    .populate('membre_id', 'nom prenom')
    .populate('projet_id', 'nom')
    .populate('tache_id', 'titre')
    .populate('valide_par', 'nom prenom')
    .lean();

  const data = feuillesTemps.map(ft => ({
    date: format(new Date(ft.date), 'dd/MM/yyyy'),
    membre: typeof ft.membre_id === 'object' && ft.membre_id
      ? `${ft.membre_id.prenom} ${ft.membre_id.nom}`
      : '',
    projet: typeof ft.projet_id === 'object' && ft.projet_id ? ft.projet_id.nom : '',
    tache: typeof ft.tache_id === 'object' && ft.tache_id ? ft.tache_id.titre : '',
    heures_travaillees: ft.heures_travaillees,
    description: ft.description || '',
    statut: ft.statut,
    valide_par: typeof ft.valide_par === 'object' && ft.valide_par
      ? `${ft.valide_par.prenom} ${ft.valide_par.nom}`
      : '',
    valide_le: ft.valide_le ? format(new Date(ft.valide_le), 'dd/MM/yyyy HH:mm') : '',
  }));

  const headers = [
    'Date',
    'Membre',
    'Projet',
    'Tâche',
    'Heures travaillées',
    'Description',
    'Statut',
    'Validé par',
    'Validé le',
  ];

  return exportToCSV(data, headers);
}

/**
 * Export des membres en CSV
 */
export async function exportMembresCSV(filters: {
  statut?: string;
  role_principal?: string;
} = {}): Promise<string> {
  await connectDB();

  const query: any = {};
  if (filters.statut) {
    query.statut = filters.statut;
  }
  if (filters.role_principal) {
    query.role_principal = filters.role_principal;
  }

  const membres = await Membre.find(query).lean();

  const data = membres.map(membre => ({
    nom: membre.nom,
    prenom: membre.prenom,
    email: membre.email,
    telephone: membre.telephone || '',
    role_principal: membre.role_principal,
    roles_secondaires: Array.isArray(membre.roles_secondaires)
      ? membre.roles_secondaires.join('; ')
      : '',
    statut: membre.statut,
    date_embauche: membre.date_embauche ? format(new Date(membre.date_embauche), 'dd/MM/yyyy') : '',
    taux_horaire: membre.taux_horaire || 0,
    disponibilite_hebdomadaire: membre.disponibilite_hebdomadaire || 0,
  }));

  const headers = [
    'Nom',
    'Prénom',
    'Email',
    'Téléphone',
    'Rôle principal',
    'Rôles secondaires',
    'Statut',
    'Date embauche',
    'Taux horaire',
    'Disponibilité hebdomadaire',
  ];

  return exportToCSV(data, headers);
}

/**
 * Export Excel (utilise xlsx)
 */
export async function exportToExcel(
  data: Array<Record<string, any>>,
  sheetName: string = 'Données'
): Promise<Buffer> {
  const XLSX = await import('xlsx');

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

/**
 * Export PDF (utilise jsPDF)
 */
export async function exportToPDF(
  title: string,
  data: Array<Record<string, any>>,
  columns: Array<{ header: string; dataKey: string; width?: number }>
): Promise<Buffer> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  
  // Titre
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  // Date d'export
  doc.setFontSize(10);
  doc.text(`Exporté le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, 14, 30);

  // Table
  const tableData = data.map(row => columns.map(col => row[col.dataKey] || ''));

  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  });

  return Buffer.from(doc.output('arraybuffer'));
}

