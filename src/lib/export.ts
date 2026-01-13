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
  
  // Colors (RGB)
  const primaryColor: [number, number, number] = [46, 139, 87]; // Emerald green
  const blueColor: [number, number, number] = [59, 130, 246]; // Blue
  const amberColor: [number, number, number] = [245, 158, 11]; // Amber
  const purpleColor: [number, number, number] = [147, 51, 234]; // Purple
  const destructiveColor: [number, number, number] = [220, 53, 69]; // Red
  const textColor: [number, number, number] = [30, 30, 30];
  const mutedColor: [number, number, number] = [120, 120, 120];
  const bgMuted: [number, number, number] = [245, 245, 245];
  const bgLight: [number, number, number] = [250, 250, 250];

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
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Add team logo if available
  if (teamLogoUrl) {
    const logoBase64 = await loadImageAsBase64(teamLogoUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', pageWidth - 45, 7, 30, 30);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SCOUTING REPORT', margin, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, margin, 32);
  doc.text('The Football Scout', margin, 40);

  // ========== PLAYER INFO SECTION ==========
  let y = 55;
  
  // Player name and position
  doc.setTextColor(...textColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(player?.full_name || 'Unknown Player', margin, y);
  
  // Overall rating box on the right
  if (report.overall_rating || overallScore > 0) {
    const ratingValue = report.overall_rating ? Math.round(report.overall_rating) : overallScore;
    drawRoundedRect(doc, pageWidth - margin - 35, y - 12, 35, 35, 4, primaryColor);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(ratingValue.toString(), pageWidth - margin - 17.5, y + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.text('OVERALL', pageWidth - margin - 17.5, y + 13, { align: 'center' });
  }
  
  y += 8;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const position = player?.position ? POSITION_LABELS[player.position as PlayerPosition] : 'Unknown';
  const club = player?.current_club || 'No Club';
  doc.text(`${position} • ${club}`, margin, y);
  y += 12;

  // Player details grid
  const details = [
    { label: 'Nationality', value: player?.nationality || 'N/A' },
    { label: 'Date of Birth', value: player?.date_of_birth || 'N/A' },
    { label: 'Height', value: player?.height_cm ? `${player.height_cm} cm` : 'N/A' },
    { label: 'Weight', value: player?.weight_kg ? `${player.weight_kg} kg` : 'N/A' },
    { label: 'Preferred Foot', value: player?.preferred_foot || 'N/A' },
  ];

  doc.setFontSize(8);
  const detailWidth = (contentWidth - 30) / 5;
  details.forEach((detail, i) => {
    const x = margin + i * detailWidth + (i * 7);
    doc.setTextColor(...mutedColor);
    doc.text(detail.label, x, y);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(detail.value, x, y + 5);
    doc.setFont('helvetica', 'normal');
  });
  y += 15;

  // ========== MATCH DETAILS BOX ==========
  drawRoundedRect(doc, margin, y, contentWidth, 22, 3, bgMuted);
  y += 6;
  
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Match Details', margin + 5, y);
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  const matchDate = format(new Date(report.match_date), 'MMMM d, yyyy');
  const opposition = report.opposition || 'Unknown';
  const competitionLevel = COMPETITION_LEVEL_LABELS[report.competition_level as CompetitionLevel] || report.competition_level;
  const minutesObserved = report.minutes_observed ? `${report.minutes_observed} mins observed` : '';
  doc.text(`${matchDate}  •  vs ${opposition}  •  ${competitionLevel}${minutesObserved ? '  •  ' + minutesObserved : ''}`, margin + 5, y);
  y += 18;

  // ========== OVERALL PERFORMANCE SECTION ==========
  // Draw a gradient-like box for overall score
  drawRoundedRect(doc, margin, y, contentWidth, 35, 4, [240, 253, 244]); // Light green bg
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 35, 4, 4, 'S');
  
  // Overall score on the left
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.text('Overall Match Rating', margin + 8, y + 8);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(overallScore.toString(), margin + 8, y + 24);
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('/100', margin + 30, y + 24);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(getScoreLabel(overallScore), margin + 8, y + 31);
  
  // Category breakdown bars on the right
  const barStartX = margin + 80;
  const barWidth = 90;
  const barHeight = 4;
  const categories = [
    { name: 'Technical', avg: Math.round(techAvg), color: primaryColor },
    { name: 'Tactical', avg: Math.round(tactAvg), color: blueColor },
    { name: 'Physical', avg: Math.round(physAvg), color: amberColor },
    { name: 'Mental', avg: Math.round(mentAvg), color: purpleColor },
  ];
  
  categories.forEach((cat, i) => {
    const catY = y + 7 + i * 7;
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(cat.name, barStartX, catY + 2);
    
    drawProgressBar(doc, barStartX + 25, catY - 1, barWidth - 40, barHeight, cat.avg, 20, bgMuted, cat.color);
    
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${cat.avg}/20`, barStartX + barWidth - 8, catY + 2);
  });
  
  y += 42;

  // ========== CATEGORY AVERAGES GRID ==========
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', margin, y);
  y += 8;

  const boxWidth = (contentWidth - 10) / 4;
  const boxHeight = 28;
  
  categories.forEach((cat, i) => {
    const boxX = margin + i * (boxWidth + 3.3);
    
    // Box background
    drawRoundedRect(doc, boxX, y, boxWidth, boxHeight, 3, bgLight);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, y, boxWidth, boxHeight, 3, 3, 'S');
    
    // Category header with color indicator
    doc.setFillColor(...cat.color);
    doc.roundedRect(boxX + 4, y + 4, 3, 10, 1, 1, 'F');
    
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.name, boxX + 10, y + 10);
    
    // Score
    doc.setFontSize(16);
    doc.text(cat.avg.toString(), boxX + 10, y + 22);
    doc.setTextColor(...mutedColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('/20', boxX + 22, y + 22);
  });
  
  y += boxHeight + 10;

  // ========== DETAILED ATTRIBUTES ==========
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Attributes', margin, y);
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
      fillColor: [255, 255, 255], 
      textColor: primaryColor,
      fontStyle: 'bold',
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 45 },
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    alternateRowStyles: { fillColor: bgLight },
  });

  const firstTableFinalY = (doc as any).lastAutoTable?.finalY || y + 50;

  autoTable(doc, {
    startY: firstTableFinalY + 3,
    head: [['Physical', '', 'Mental', '']],
    body: physicalAttrs.map((p, i) => [
      p[0],
      p[1]?.toString() || '-',
      mentalAttrs[i]?.[0] || '',
      mentalAttrs[i]?.[1]?.toString() || '-',
    ]),
    theme: 'plain',
    headStyles: { 
      fillColor: [255, 255, 255], 
      textColor: amberColor,
      fontStyle: 'bold',
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 45 },
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    alternateRowStyles: { fillColor: bgLight },
  });

  y = (doc as any).lastAutoTable?.finalY + 10 || firstTableFinalY + 60;

  // ========== STRENGTHS & WEAKNESSES ==========
  if (report.strengths || report.weaknesses) {
    const halfWidth = (contentWidth - 5) / 2;
    
    if (report.strengths) {
      // Strengths box
      const strengthLines = doc.splitTextToSize(report.strengths, halfWidth - 12);
      const strengthBoxHeight = Math.max(25, 15 + strengthLines.length * 4);
      
      drawRoundedRect(doc, margin, y, halfWidth, strengthBoxHeight, 3, [240, 253, 244]);
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, halfWidth, strengthBoxHeight, 3, 3, 'S');
      
      doc.setTextColor(...primaryColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ Strengths', margin + 5, y + 8);
      
      doc.setTextColor(...textColor);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(strengthLines, margin + 5, y + 15);
    }

    if (report.weaknesses) {
      // Weaknesses box
      const weaknessLines = doc.splitTextToSize(report.weaknesses, halfWidth - 12);
      const weaknessBoxHeight = Math.max(25, 15 + weaknessLines.length * 4);
      const weaknessX = margin + halfWidth + 5;
      
      drawRoundedRect(doc, weaknessX, y, halfWidth, weaknessBoxHeight, 3, [254, 242, 242]);
      doc.setDrawColor(...destructiveColor);
      doc.setLineWidth(0.5);
      doc.roundedRect(weaknessX, y, halfWidth, weaknessBoxHeight, 3, 3, 'S');
      
      doc.setTextColor(...destructiveColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('✗ Areas to Improve', weaknessX + 5, y + 8);
      
      doc.setTextColor(...textColor);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(weaknessLines, weaknessX + 5, y + 15);
      
      const maxBoxHeight = Math.max(
        report.strengths ? Math.max(25, 15 + doc.splitTextToSize(report.strengths, halfWidth - 12).length * 4) : 0,
        weaknessBoxHeight
      );
      y += maxBoxHeight + 8;
    } else if (report.strengths) {
      const strengthLines = doc.splitTextToSize(report.strengths, halfWidth - 12);
      y += Math.max(25, 15 + strengthLines.length * 4) + 8;
    }
  }

  // ========== RECOMMENDATION ==========
  if (report.recommendation) {
    drawRoundedRect(doc, margin, y, contentWidth, 25, 3, bgMuted);
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Scout Recommendation', margin + 5, y + 8);
    
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const recLines = doc.splitTextToSize(report.recommendation, contentWidth - 12);
    doc.text(recLines, margin + 5, y + 15);
    y += 30;
  }

  // ========== POTENTIAL RATING ==========
  if (report.potential_rating) {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(9);
    doc.text(`Potential Rating: `, margin, y);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(report.potential_rating.toString(), margin + 28, y);
  }

  // ========== FOOTER ==========
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text('The Football Scout', margin, 287);
  doc.text(`Report ID: ${report.id.substring(0, 8)}...`, pageWidth - margin, 287, { align: 'right' });

  // Save
  const filename = `scouting_report_${player?.full_name?.replace(/\s+/g, '_') || 'unknown'}_${format(new Date(report.match_date), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}