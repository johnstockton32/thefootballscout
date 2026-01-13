import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { POSITION_LABELS, COMPETITION_LEVEL_LABELS, PlayerPosition, CompetitionLevel } from '@/lib/supabase';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

// CSV Export Functions
export async function exportPlayersCSV() {
  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .order('full_name');

  if (error) throw error;
  if (!players || players.length === 0) throw new Error('No players to export');

  const headers = [
    'Name',
    'Position',
    'Secondary Position',
    'Date of Birth',
    'Nationality',
    'Current Club',
    'Height (cm)',
    'Weight (kg)',
    'Preferred Foot',
    'Notes',
    'Created At',
  ];

  const rows = players.map((p) => [
    p.full_name,
    POSITION_LABELS[p.position as PlayerPosition] || p.position,
    p.secondary_position ? POSITION_LABELS[p.secondary_position as PlayerPosition] : '',
    p.date_of_birth || '',
    p.nationality || '',
    p.current_club || '',
    p.height_cm?.toString() || '',
    p.weight_kg?.toString() || '',
    p.preferred_foot || '',
    p.notes?.replace(/[\n\r]/g, ' ') || '',
    format(new Date(p.created_at), 'yyyy-MM-dd'),
  ]);

  downloadCSV(headers, rows, 'players_export.csv');
}

export async function exportReportsCSV() {
  const { data: reports, error } = await supabase
    .from('scouting_reports')
    .select(`
      *,
      players (
        full_name,
        position
      )
    `)
    .order('match_date', { ascending: false });

  if (error) throw error;
  if (!reports || reports.length === 0) throw new Error('No reports to export');

  const headers = [
    'Player Name',
    'Position',
    'Match Date',
    'Opposition',
    'Competition Level',
    'Overall Rating',
    'Potential Rating',
    'Technical Passing',
    'Technical Dribbling',
    'Technical Shooting',
    'Technical First Touch',
    'Technical Crossing',
    'Technical Heading',
    'Tactical Positioning',
    'Tactical Decision Making',
    'Tactical Awareness',
    'Tactical Off-Ball Movement',
    'Tactical Defensive Contribution',
    'Physical Pace',
    'Physical Agility',
    'Physical Strength',
    'Physical Stamina',
    'Physical Balance',
    'Mental Composure',
    'Mental Concentration',
    'Mental Work Rate',
    'Mental Leadership',
    'Mental Aggression',
    'Strengths',
    'Weaknesses',
    'Recommendation',
    'Created At',
  ];

  const rows = reports.map((r: any) => [
    r.players?.full_name || 'Unknown',
    r.players?.position ? POSITION_LABELS[r.players.position as PlayerPosition] : '',
    r.match_date,
    r.opposition || '',
    COMPETITION_LEVEL_LABELS[r.competition_level as CompetitionLevel] || r.competition_level,
    r.overall_rating?.toString() || '',
    r.potential_rating?.toString() || '',
    r.technical_passing?.toString() || '',
    r.technical_dribbling?.toString() || '',
    r.technical_shooting?.toString() || '',
    r.technical_first_touch?.toString() || '',
    r.technical_crossing?.toString() || '',
    r.technical_heading?.toString() || '',
    r.tactical_positioning?.toString() || '',
    r.tactical_decision_making?.toString() || '',
    r.tactical_awareness?.toString() || '',
    r.tactical_off_ball_movement?.toString() || '',
    r.tactical_defensive_contribution?.toString() || '',
    r.physical_pace?.toString() || '',
    r.physical_agility?.toString() || '',
    r.physical_strength?.toString() || '',
    r.physical_stamina?.toString() || '',
    r.physical_balance?.toString() || '',
    r.mental_composure?.toString() || '',
    r.mental_concentration?.toString() || '',
    r.mental_work_rate?.toString() || '',
    r.mental_leadership?.toString() || '',
    r.mental_aggression?.toString() || '',
    r.strengths?.replace(/[\n\r]/g, ' ') || '',
    r.weaknesses?.replace(/[\n\r]/g, ' ') || '',
    r.recommendation?.replace(/[\n\r]/g, ' ') || '',
    format(new Date(r.created_at), 'yyyy-MM-dd'),
  ]);

  downloadCSV(headers, rows, 'reports_export.csv');
}

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper function to load image as base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// PDF Export Function
export async function exportReportPDF(reportId: string, teamLogoUrl?: string | null) {
  const { data: report, error } = await supabase
    .from('scouting_reports')
    .select(`
      *,
      players (
        full_name,
        position,
        secondary_position,
        date_of_birth,
        nationality,
        current_club,
        height_cm,
        weight_kg,
        preferred_foot
      )
    `)
    .eq('id', reportId)
    .single();

  if (error) throw error;
  if (!report) throw new Error('Report not found');

  const doc = new jsPDF();
  const player = report.players as any;
  
  // Colors
  const primaryColor: [number, number, number] = [46, 139, 87]; // Emerald green
  const textColor: [number, number, number] = [30, 30, 30];
  const mutedColor: [number, number, number] = [100, 100, 100];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Add team logo if available
  if (teamLogoUrl) {
    const logoBase64 = await loadImageAsBase64(teamLogoUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 170, 5, 30, 30);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SCOUTING REPORT', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 35);

  // Player Info Section
  let y = 55;
  
  doc.setTextColor(...textColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(player?.full_name || 'Unknown Player', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(...mutedColor);
  const position = player?.position ? POSITION_LABELS[player.position as PlayerPosition] : 'Unknown';
  const club = player?.current_club || 'No Club';
  doc.text(`${position} • ${club}`, 20, y);
  y += 15;

  // Player Details Grid
  const playerDetails = [
    ['Nationality', player?.nationality || 'N/A'],
    ['Date of Birth', player?.date_of_birth || 'N/A'],
    ['Height', player?.height_cm ? `${player.height_cm} cm` : 'N/A'],
    ['Weight', player?.weight_kg ? `${player.weight_kg} kg` : 'N/A'],
    ['Preferred Foot', player?.preferred_foot || 'N/A'],
  ];

  doc.setFontSize(10);
  playerDetails.forEach(([label, value], i) => {
    const x = 20 + (i % 3) * 60;
    const yPos = y + Math.floor(i / 3) * 12;
    doc.setTextColor(...mutedColor);
    doc.text(label, x, yPos);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x, yPos + 5);
    doc.setFont('helvetica', 'normal');
  });
  y += 30;

  // Match Details
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y, 170, 25, 'F');
  y += 8;
  
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Match Details', 25, y);
  y += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const matchInfo = `${format(new Date(report.match_date), 'MMMM d, yyyy')} vs ${report.opposition || 'Unknown'} • ${COMPETITION_LEVEL_LABELS[report.competition_level as CompetitionLevel]}`;
  doc.text(matchInfo, 25, y);
  y += 20;

  // Ratings Box
  if (report.overall_rating) {
    doc.setFillColor(...primaryColor);
    doc.rect(150, 55, 40, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(Math.round(report.overall_rating).toString(), 170, 75, { align: 'center' });
    doc.setFontSize(8);
    doc.text('OVERALL', 170, 82, { align: 'center' });
  }

  // Attributes Table
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Attributes', 20, y);
  y += 5;

  const technicalAttrs = [
    ['First Touch', report.technical_first_touch],
    ['Passing', report.technical_passing],
    ['Dribbling', report.technical_dribbling],
    ['Shooting', report.technical_shooting],
    ['Crossing', report.technical_crossing],
    ['Heading', report.technical_heading],
  ];

  const tacticalAttrs = [
    ['Positioning', report.tactical_positioning],
    ['Decision Making', report.tactical_decision_making],
    ['Awareness', report.tactical_awareness],
    ['Off-Ball Movement', report.tactical_off_ball_movement],
    ['Defensive Contrib.', report.tactical_defensive_contribution],
  ];

  const physicalAttrs = [
    ['Pace', report.physical_pace],
    ['Agility', report.physical_agility],
    ['Strength', report.physical_strength],
    ['Stamina', report.physical_stamina],
    ['Balance', report.physical_balance],
  ];

  const mentalAttrs = [
    ['Composure', report.mental_composure],
    ['Concentration', report.mental_concentration],
    ['Work Rate', report.mental_work_rate],
    ['Leadership', report.mental_leadership],
    ['Aggression', report.mental_aggression],
  ];

  doc.autoTable({
    startY: y,
    head: [['Technical', 'Rating', 'Tactical', 'Rating']],
    body: technicalAttrs.map((t, i) => [
      t[0],
      t[1]?.toString() || '-',
      tacticalAttrs[i]?.[0] || '',
      tacticalAttrs[i]?.[1]?.toString() || '-',
    ]),
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9 },
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 5,
    head: [['Physical', 'Rating', 'Mental', 'Rating']],
    body: physicalAttrs.map((p, i) => [
      p[0],
      p[1]?.toString() || '-',
      mentalAttrs[i]?.[0] || '',
      mentalAttrs[i]?.[1]?.toString() || '-',
    ]),
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9 },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Strengths & Weaknesses
  if (report.strengths || report.weaknesses) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    if (report.strengths) {
      doc.setTextColor(46, 139, 87);
      doc.text('Strengths', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      const strengthLines = doc.splitTextToSize(report.strengths, 170);
      doc.text(strengthLines, 20, y + 6);
      y += 6 + strengthLines.length * 5 + 10;
    }

    if (report.weaknesses) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(220, 53, 69);
      doc.text('Weaknesses', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      const weaknessLines = doc.splitTextToSize(report.weaknesses, 170);
      doc.text(weaknessLines, 20, y + 6);
      y += 6 + weaknessLines.length * 5 + 10;
    }
  }

  // Recommendation
  if (report.recommendation) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Recommendation', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    const recLines = doc.splitTextToSize(report.recommendation, 170);
    doc.text(recLines, 20, y + 6);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text('The Football Scout', 20, 285);
  doc.text(`Report ID: ${report.id}`, 190, 285, { align: 'right' });

  // Save
  const filename = `scouting_report_${player?.full_name?.replace(/\s+/g, '_') || 'unknown'}_${format(new Date(report.match_date), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
