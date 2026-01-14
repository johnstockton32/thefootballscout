import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { POSITION_LABELS, COMPETITION_LEVEL_LABELS, PlayerPosition, CompetitionLevel } from '@/lib/supabase';

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

// Helper to get score label
function getScoreLabel(score: number): string {
  if (score >= 90) return 'World Class';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Average';
  return 'Developing';
}

// Helper to draw a rounded rectangle
function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fillColor: [number, number, number]) {
  doc.setFillColor(...fillColor);
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

// Helper to draw a progress bar
function drawProgressBar(doc: jsPDF, x: number, y: number, width: number, height: number, value: number, maxValue: number, bgColor: [number, number, number], fillColor: [number, number, number]) {
  const percentage = Math.min(value / maxValue, 1);
  
  // Background
  doc.setFillColor(...bgColor);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, 'F');
  
  // Fill
  if (percentage > 0) {
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, width * percentage, height, height / 2, height / 2, 'F');
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
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  // Colors (RGB) - Matching the app's design system
  const primaryColor: [number, number, number] = [39, 174, 96]; // Emerald green (hsl 158 64% 45%)
  const blueColor: [number, number, number] = [59, 130, 246]; // Blue
  const amberColor: [number, number, number] = [245, 158, 11]; // Amber/Gold
  const purpleColor: [number, number, number] = [147, 51, 234]; // Purple
  const destructiveColor: [number, number, number] = [239, 68, 68]; // Red
  const textDark: [number, number, number] = [30, 30, 30];
  const textMuted: [number, number, number] = [107, 114, 128];
  const bgCard: [number, number, number] = [249, 250, 251];
  const bgMuted: [number, number, number] = [243, 244, 246];
  const white: [number, number, number] = [255, 255, 255];

  // Calculate category averages
  const techValues = [report.technical_first_touch, report.technical_passing, report.technical_dribbling, report.technical_shooting, report.technical_crossing, report.technical_heading].filter(v => v != null);
  const tactValues = [report.tactical_positioning, report.tactical_decision_making, report.tactical_awareness, report.tactical_off_ball_movement, report.tactical_defensive_contribution].filter(v => v != null);
  const physValues = [report.physical_pace, report.physical_agility, report.physical_strength, report.physical_stamina, report.physical_balance].filter(v => v != null);
  const mentValues = [report.mental_composure, report.mental_concentration, report.mental_work_rate, report.mental_leadership, report.mental_aggression].filter(v => v != null);

  const techAvg = techValues.length > 0 ? techValues.reduce((a, b) => a + b, 0) / techValues.length : 0;
  const tactAvg = tactValues.length > 0 ? tactValues.reduce((a, b) => a + b, 0) / tactValues.length : 0;
  const physAvg = physValues.length > 0 ? physValues.reduce((a, b) => a + b, 0) / physValues.length : 0;
  const mentAvg = mentValues.length > 0 ? mentValues.reduce((a, b) => a + b, 0) / mentValues.length : 0;

  // Calculate overall score (0-100)
  const categoryCount = [techAvg, tactAvg, physAvg, mentAvg].filter(v => v > 0).length;
  const overallScore = categoryCount > 0 ? Math.round(((techAvg + tactAvg + physAvg + mentAvg) / categoryCount) * 5) : 0;

  // ========== HEADER ==========
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add team logo if available
  if (teamLogoUrl) {
    const logoBase64 = await loadImageAsBase64(teamLogoUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', pageWidth - 42, 5, 28, 28);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SCOUTING REPORT', margin, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`The Football Scout  •  ${format(new Date(), 'MMMM d, yyyy')}`, margin, 30);

  // ========== PLAYER INFO SECTION ==========
  let y = 50;
  
  // Player name and position
  doc.setTextColor(...textDark);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(player?.full_name || 'Unknown Player', margin, y);
  
  // Overall rating badge on the right
  if (report.overall_rating || overallScore > 0) {
    const ratingValue = report.overall_rating ? Math.round(report.overall_rating) : overallScore;
    drawRoundedRect(doc, pageWidth - margin - 30, y - 10, 30, 30, 4, primaryColor);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(ratingValue.toString(), pageWidth - margin - 15, y + 4, { align: 'center' });
    doc.setFontSize(6);
    doc.text('RATING', pageWidth - margin - 15, y + 11, { align: 'center' });
  }
  
  y += 6;
  doc.setTextColor(...textMuted);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const position = player?.position ? POSITION_LABELS[player.position as PlayerPosition] : 'Unknown';
  const club = player?.current_club || 'No Club';
  doc.text(`${position}  •  ${club}`, margin, y);
  y += 10;

  // Player details row
  const details = [
    { label: 'Nationality', value: player?.nationality || 'N/A' },
    { label: 'DOB', value: player?.date_of_birth || 'N/A' },
    { label: 'Height', value: player?.height_cm ? `${player.height_cm}cm` : 'N/A' },
    { label: 'Weight', value: player?.weight_kg ? `${player.weight_kg}kg` : 'N/A' },
    { label: 'Foot', value: player?.preferred_foot || 'N/A' },
  ];

  doc.setFontSize(8);
  const detailWidth = contentWidth / 5;
  details.forEach((detail, i) => {
    const x = margin + i * detailWidth;
    doc.setTextColor(...textMuted);
    doc.text(detail.label, x, y);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.text(detail.value, x, y + 4);
    doc.setFont('helvetica', 'normal');
  });
  y += 12;

  // ========== MATCH DETAILS BOX ==========
  drawRoundedRect(doc, margin, y, contentWidth, 20, 3, bgMuted);
  y += 5;
  
  doc.setTextColor(...textDark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Match Details', margin + 4, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  const matchDate = format(new Date(report.match_date), 'MMM d, yyyy');
  const opposition = report.opposition || 'Unknown';
  const competitionLevel = COMPETITION_LEVEL_LABELS[report.competition_level as CompetitionLevel] || report.competition_level;
  const minutesObserved = report.minutes_observed ? `${report.minutes_observed} mins` : '';
  doc.text(`${matchDate}  •  vs ${opposition}  •  ${competitionLevel}${minutesObserved ? '  •  ' + minutesObserved : ''}`, margin + 4, y);
  y += 14;

  // ========== OVERALL PERFORMANCE SECTION ==========
  // Draw a clean card-style box
  drawRoundedRect(doc, margin, y, contentWidth, 32, 4, white);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 32, 4, 4, 'S');
  
  // Overall score on the left with colored accent
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, 4, 32, 'F');
  
  doc.setTextColor(...textMuted);
  doc.setFontSize(8);
  doc.text('Overall Match Rating', margin + 8, y + 7);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(overallScore.toString(), margin + 8, y + 22);
  
  doc.setTextColor(...textMuted);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('/100', margin + 26, y + 22);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(getScoreLabel(overallScore), margin + 8, y + 28);
  
  // Category breakdown bars on the right
  const barStartX = margin + 75;
  const barWidth = 85;
  const barHeight = 3;
  const categories = [
    { name: 'Technical', avg: Math.round(techAvg), color: primaryColor },
    { name: 'Tactical', avg: Math.round(tactAvg), color: blueColor },
    { name: 'Physical', avg: Math.round(physAvg), color: amberColor },
    { name: 'Mental', avg: Math.round(mentAvg), color: purpleColor },
  ];
  
  categories.forEach((cat, i) => {
    const catY = y + 6 + i * 6;
    doc.setTextColor(...textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(cat.name, barStartX, catY + 2);
    
    drawProgressBar(doc, barStartX + 22, catY, barWidth - 35, barHeight, cat.avg, 20, bgMuted, cat.color);
    
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.text(`${cat.avg}/20`, barStartX + barWidth - 6, catY + 2);
  });
  
  y += 38;

  // ========== CATEGORY AVERAGES GRID ==========
  doc.setTextColor(...textDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', margin, y);
  y += 6;

  const boxWidth = (contentWidth - 9) / 4;
  const boxHeight = 24;
  
  categories.forEach((cat, i) => {
    const boxX = margin + i * (boxWidth + 3);
    
    // Box background
    drawRoundedRect(doc, boxX, y, boxWidth, boxHeight, 3, white);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, y, boxWidth, boxHeight, 3, 3, 'S');
    
    // Category color bar on left
    doc.setFillColor(...cat.color);
    doc.roundedRect(boxX + 3, y + 4, 2, 16, 1, 1, 'F');
    
    doc.setTextColor(...textDark);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.name, boxX + 8, y + 9);
    
    // Score
    doc.setFontSize(14);
    doc.text(cat.avg.toString(), boxX + 8, y + 19);
    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('/20', boxX + 18, y + 19);
  });
  
  y += boxHeight + 8;

  // ========== DETAILED ATTRIBUTES ==========
  doc.setTextColor(...textDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Attributes', margin, y);
  y += 4;

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

  autoTable(doc, {
    startY: y,
    head: [['Technical', '', 'Tactical', '']],
    body: technicalAttrs.map((t, i) => [
      t[0],
      t[1]?.toString() || '-',
      tacticalAttrs[i]?.[0] || '',
      tacticalAttrs[i]?.[1]?.toString() || '-',
    ]),
    theme: 'plain',
    headStyles: { 
      fillColor: white, 
      textColor: primaryColor,
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: bgCard },
  });

  const firstTableFinalY = (doc as any).lastAutoTable?.finalY || y + 50;

  autoTable(doc, {
    startY: firstTableFinalY + 2,
    head: [['Physical', '', 'Mental', '']],
    body: physicalAttrs.map((p, i) => [
      p[0],
      p[1]?.toString() || '-',
      mentalAttrs[i]?.[0] || '',
      mentalAttrs[i]?.[1]?.toString() || '-',
    ]),
    theme: 'plain',
    headStyles: { 
      fillColor: white, 
      textColor: amberColor,
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: bgCard },
  });

  y = (doc as any).lastAutoTable?.finalY + 8 || firstTableFinalY + 55;

  // ========== STRENGTHS & WEAKNESSES ==========
  if (report.strengths || report.weaknesses) {
    const halfWidth = (contentWidth - 6) / 2;
    
    if (report.strengths) {
      // Strengths box - clean green border style
      const strengthLines = doc.splitTextToSize(report.strengths, halfWidth - 10);
      const strengthBoxHeight = Math.max(22, 14 + strengthLines.length * 3.5);
      
      drawRoundedRect(doc, margin, y, halfWidth, strengthBoxHeight, 3, white);
      doc.setFillColor(...primaryColor);
      doc.rect(margin, y, 3, strengthBoxHeight, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, halfWidth, strengthBoxHeight, 3, 3, 'S');
      
      doc.setTextColor(...primaryColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Strengths', margin + 6, y + 7);
      
      doc.setTextColor(...textDark);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(strengthLines, margin + 6, y + 13);
    }

    if (report.weaknesses) {
      // Weaknesses box - clean red border style
      const weaknessLines = doc.splitTextToSize(report.weaknesses, halfWidth - 10);
      const weaknessBoxHeight = Math.max(22, 14 + weaknessLines.length * 3.5);
      const weaknessX = margin + halfWidth + 6;
      
      drawRoundedRect(doc, weaknessX, y, halfWidth, weaknessBoxHeight, 3, white);
      doc.setFillColor(...destructiveColor);
      doc.rect(weaknessX, y, 3, weaknessBoxHeight, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(weaknessX, y, halfWidth, weaknessBoxHeight, 3, 3, 'S');
      
      doc.setTextColor(...destructiveColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Areas to Improve', weaknessX + 6, y + 7);
      
      doc.setTextColor(...textDark);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(weaknessLines, weaknessX + 6, y + 13);
      
      const maxBoxHeight = Math.max(
        report.strengths ? Math.max(22, 14 + doc.splitTextToSize(report.strengths, halfWidth - 10).length * 3.5) : 0,
        weaknessBoxHeight
      );
      y += maxBoxHeight + 6;
    } else if (report.strengths) {
      const strengthLines = doc.splitTextToSize(report.strengths, halfWidth - 10);
      y += Math.max(22, 14 + strengthLines.length * 3.5) + 6;
    }
  }

  // ========== RECOMMENDATION ==========
  if (report.recommendation) {
    drawRoundedRect(doc, margin, y, contentWidth, 22, 3, bgMuted);
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Scout Recommendation', margin + 4, y + 7);
    
    doc.setTextColor(...textDark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const recLines = doc.splitTextToSize(report.recommendation, contentWidth - 10);
    doc.text(recLines, margin + 4, y + 13);
    y += 26;
  }

  // ========== POTENTIAL RATING ==========
  if (report.potential_rating) {
    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.text('Potential Rating: ', margin, y);
    doc.setTextColor(...amberColor);
    doc.setFont('helvetica', 'bold');
    doc.text(report.potential_rating.toString(), margin + 26, y);
  }

  // ========== FOOTER ==========
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('The Football Scout', margin, 287);
  doc.text(`Report ID: ${report.id.substring(0, 8)}`, pageWidth - margin, 287, { align: 'right' });

  // Save
  const filename = `scouting_report_${player?.full_name?.replace(/\s+/g, '_') || 'unknown'}_${format(new Date(report.match_date), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}