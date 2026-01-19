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
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  
  // Dark theme colors (RGB) - Matching the reference image
  const bgDark: [number, number, number] = [22, 33, 62]; // Dark navy background
  const bgCard: [number, number, number] = [30, 41, 70]; // Slightly lighter card
  const bgCardAlt: [number, number, number] = [37, 49, 82]; // Alternative card bg
  const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald/teal green
  const blueColor: [number, number, number] = [59, 130, 246]; // Blue
  const amberColor: [number, number, number] = [250, 204, 21]; // Yellow/Gold
  const purpleColor: [number, number, number] = [192, 132, 252]; // Light purple/pink
  const redColor: [number, number, number] = [239, 68, 68]; // Red
  const white: [number, number, number] = [255, 255, 255];
  const textMuted: [number, number, number] = [156, 163, 175]; // Gray text
  const textLight: [number, number, number] = [229, 231, 235]; // Light gray

  // Calculate category averages
  const techValues = [report.technical_first_touch, report.technical_passing, report.technical_dribbling, report.technical_shooting, report.technical_crossing, report.technical_heading].filter(v => v != null);
  const tactValues = [report.tactical_positioning, report.tactical_decision_making, report.tactical_awareness, report.tactical_off_ball_movement, report.tactical_defensive_contribution].filter(v => v != null);
  const physValues = [report.physical_pace, report.physical_agility, report.physical_strength, report.physical_stamina, report.physical_balance].filter(v => v != null);
  const mentValues = [report.mental_composure, report.mental_concentration, report.mental_work_rate, report.mental_leadership, report.mental_aggression].filter(v => v != null);

  const techAvg = techValues.length > 0 ? Math.round(techValues.reduce((a, b) => a + b, 0) / techValues.length) : 0;
  const tactAvg = tactValues.length > 0 ? Math.round(tactValues.reduce((a, b) => a + b, 0) / tactValues.length) : 0;
  const physAvg = physValues.length > 0 ? Math.round(physValues.reduce((a, b) => a + b, 0) / physValues.length) : 0;
  const mentAvg = mentValues.length > 0 ? Math.round(mentValues.reduce((a, b) => a + b, 0) / mentValues.length) : 0;

  // Calculate overall score (0-100)
  const categoryCount = [techAvg, tactAvg, physAvg, mentAvg].filter(v => v > 0).length;
  const overallScore = categoryCount > 0 ? Math.round(((techAvg + tactAvg + physAvg + mentAvg) / categoryCount) * 5) : 0;

  // ========== FULL PAGE DARK BACKGROUND ==========
  doc.setFillColor(...bgDark);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // ========== HEADER - Player Info ==========
  let y = margin;
  
  // Player name
  doc.setTextColor(...white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(player?.full_name || 'Unknown Player', margin, y + 6);
  
  const position = player?.position ? POSITION_LABELS[player.position as PlayerPosition] : 'Unknown';
  const club = player?.current_club || 'No Club';
  doc.setTextColor(...textMuted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${position} • ${club}`, margin, y + 12);

  // Add team logo if available (top right)
  if (teamLogoUrl) {
    const logoBase64 = await loadImageAsBase64(teamLogoUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', pageWidth - margin - 18, y, 16, 16);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }
  }

  y += 20;

  // ========== OVERALL MATCH RATING SECTION ==========
  const ratingCardHeight = 52;
  drawRoundedRect(doc, margin, y, contentWidth, ratingCardHeight, 4, bgCard);
  
  // "Overall Match Rating" label
  doc.setTextColor(...textMuted);
  doc.setFontSize(8);
  doc.text('Overall Match Rating', margin + 8, y + 10);
  
  // Large score
  doc.setTextColor(...white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(overallScore.toString(), margin + 8, y + 30);
  doc.setTextColor(...textMuted);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('/100', margin + 28, y + 30);
  
  // Score label (Very Good, etc.)
  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(getScoreLabel(overallScore), margin + 8, y + 38);
  
  // Circular rating indicator (right side) - simplified as a circle arc
  const circleX = pageWidth - margin - 25;
  const circleY = y + 26;
  const circleR = 16;
  
  // Background circle
  doc.setDrawColor(...bgCardAlt);
  doc.setLineWidth(3);
  doc.circle(circleX, circleY, circleR, 'S');
  
  // Progress arc (simplified as colored circle)
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(3);
  doc.circle(circleX, circleY, circleR, 'S');
  
  // Star icon placeholder (just text)
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.text('★', circleX - 3, circleY + 4);
  
  // Category progress bar at bottom of rating card
  const barY = y + ratingCardHeight - 8;
  const barTotalWidth = contentWidth - 16;
  const barSegmentWidth = barTotalWidth / 4;
  const barHeight = 4;
  
  const categories = [
    { name: 'Technical', avg: techAvg, color: primaryColor },
    { name: 'Tactical', avg: tactAvg, color: blueColor },
    { name: 'Physical', avg: physAvg, color: amberColor },
    { name: 'Mental', avg: mentAvg, color: purpleColor },
  ];
  
  categories.forEach((cat, i) => {
    const segX = margin + 8 + i * barSegmentWidth;
    const fillWidth = (cat.avg / 20) * (barSegmentWidth - 2);
    
    // Background
    doc.setFillColor(...bgCardAlt);
    doc.rect(segX, barY, barSegmentWidth - 2, barHeight, 'F');
    
    // Fill
    doc.setFillColor(...cat.color);
    doc.rect(segX, barY, fillWidth, barHeight, 'F');
  });
  
  // Category labels below bar
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  categories.forEach((cat, i) => {
    const labelX = margin + 8 + i * barSegmentWidth + (barSegmentWidth - 2) / 2;
    doc.setTextColor(...textMuted);
    doc.text(cat.name, labelX, barY + 7, { align: 'center' });
  });
  
  y += ratingCardHeight + 6;

  // ========== CATEGORY CARDS ROW ==========
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 28;
  
  categories.forEach((cat, i) => {
    const cardX = margin + i * (cardWidth + 3);
    drawRoundedRect(doc, cardX, y, cardWidth, cardHeight, 3, bgCard);
    
    // Category icon/indicator
    doc.setFillColor(...cat.color);
    doc.circle(cardX + 6, y + 8, 2, 'F');
    
    // Category name
    doc.setTextColor(...cat.color);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.name, cardX + 10, y + 9);
    
    // Score
    doc.setTextColor(...white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.avg.toString(), cardX + 6, y + 22);
    doc.setTextColor(...textMuted);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('/20', cardX + 16, y + 22);
  });
  
  y += cardHeight + 8;

  // ========== ATTRIBUTE OVERVIEW (Radar Chart - simplified as text) ==========
  drawRoundedRect(doc, margin, y, contentWidth, 50, 4, bgCard);
  
  doc.setTextColor(...blueColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 Attribute Overview', margin + 8, y + 10);
  
  // Draw a simplified radar representation with key attributes
  const radarAttrs = [
    { name: 'Passing', value: report.technical_passing || 0 },
    { name: 'Dribbling', value: report.technical_dribbling || 0 },
    { name: 'Shooting', value: report.technical_shooting || 0 },
    { name: 'Positioning', value: report.tactical_positioning || 0 },
    { name: 'Awareness', value: report.tactical_awareness || 0 },
    { name: 'Pace', value: report.physical_pace || 0 },
    { name: 'Stamina', value: report.physical_stamina || 0 },
    { name: 'Composure', value: report.mental_composure || 0 },
  ];
  
  const radarStartX = margin + 8;
  const radarY = y + 18;
  const colWidth = (contentWidth - 16) / 4;
  
  radarAttrs.forEach((attr, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const attrX = radarStartX + col * colWidth;
    const attrY = radarY + row * 14;
    
    doc.setTextColor(...textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(attr.name, attrX, attrY);
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(attr.value.toString(), attrX + 28, attrY);
  });
  
  y += 54;

  // ========== DETAILED ATTRIBUTES SECTION ==========
  drawRoundedRect(doc, margin, y, contentWidth, 85, 4, bgCard);
  
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Attributes', margin + 8, y + 10);
  
  // Draw attribute bars in 2 columns
  const attrBarWidth = 50;
  const attrBarHeight = 3;
  const leftColX = margin + 8;
  const rightColX = margin + contentWidth / 2 + 4;
  let attrY = y + 18;
  
  // Technical attributes (left column)
  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('⚽ Technical', leftColX, attrY);
  attrY += 5;
  
  const technicalAttrs = [
    ['First Touch', report.technical_first_touch],
    ['Passing', report.technical_passing],
    ['Dribbling', report.technical_dribbling],
    ['Shooting', report.technical_shooting],
    ['Crossing', report.technical_crossing],
    ['Heading', report.technical_heading],
  ];
  
  technicalAttrs.forEach(([name, value]) => {
    doc.setTextColor(...textLight);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(name as string, leftColX, attrY + 2);
    
    // Progress bar
    drawProgressBar(doc, leftColX + 25, attrY - 1, attrBarWidth, attrBarHeight, (value as number) || 0, 20, bgCardAlt, amberColor);
    
    // Value
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(((value as number) || 0).toString(), leftColX + attrBarWidth + 28, attrY + 2);
    
    attrY += 6;
  });
  
  // Tactical attributes (right column, first half)
  let rightAttrY = y + 18;
  doc.setTextColor(...blueColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('📋 Tactical', rightColX, rightAttrY);
  rightAttrY += 5;
  
  const tacticalAttrs = [
    ['Positioning', report.tactical_positioning],
    ['Decision Making', report.tactical_decision_making],
    ['Awareness', report.tactical_awareness],
    ['Off-Ball Movement', report.tactical_off_ball_movement],
    ['Def. Contribution', report.tactical_defensive_contribution],
  ];
  
  tacticalAttrs.forEach(([name, value]) => {
    doc.setTextColor(...textLight);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(name as string, rightColX, rightAttrY + 2);
    
    drawProgressBar(doc, rightColX + 30, rightAttrY - 1, attrBarWidth - 5, attrBarHeight, (value as number) || 0, 20, bgCardAlt, amberColor);
    
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(((value as number) || 0).toString(), rightColX + attrBarWidth + 28, rightAttrY + 2);
    
    rightAttrY += 6;
  });
  
  // Physical (left column, second half)
  attrY += 4;
  doc.setTextColor(...amberColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ Physical', leftColX, attrY);
  attrY += 5;
  
  const physicalAttrs = [
    ['Pace', report.physical_pace],
    ['Agility', report.physical_agility],
    ['Strength', report.physical_strength],
    ['Stamina', report.physical_stamina],
    ['Balance', report.physical_balance],
  ];
  
  physicalAttrs.forEach(([name, value]) => {
    doc.setTextColor(...textLight);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(name as string, leftColX, attrY + 2);
    
    drawProgressBar(doc, leftColX + 25, attrY - 1, attrBarWidth, attrBarHeight, (value as number) || 0, 20, bgCardAlt, amberColor);
    
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(((value as number) || 0).toString(), leftColX + attrBarWidth + 28, attrY + 2);
    
    attrY += 6;
  });
  
  // Mental (right column, second half)
  rightAttrY += 4;
  doc.setTextColor(...purpleColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('○ Mental', rightColX, rightAttrY);
  rightAttrY += 5;
  
  const mentalAttrs = [
    ['Composure', report.mental_composure],
    ['Concentration', report.mental_concentration],
    ['Work Rate', report.mental_work_rate],
    ['Leadership', report.mental_leadership],
    ['Aggression', report.mental_aggression],
  ];
  
  mentalAttrs.forEach(([name, value]) => {
    doc.setTextColor(...textLight);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(name as string, rightColX, rightAttrY + 2);
    
    drawProgressBar(doc, rightColX + 30, rightAttrY - 1, attrBarWidth - 5, attrBarHeight, (value as number) || 0, 20, bgCardAlt, amberColor);
    
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(((value as number) || 0).toString(), rightColX + attrBarWidth + 28, rightAttrY + 2);
    
    rightAttrY += 6;
  });
  
  y += 89;

  // ========== STRENGTHS & AREAS TO IMPROVE ==========
  const halfWidth = (contentWidth - 4) / 2;
  const obsCardHeight = 28;
  
  // Strengths card (left)
  drawRoundedRect(doc, margin, y, halfWidth, obsCardHeight, 3, bgCard);
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, 3, obsCardHeight, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ Strengths', margin + 8, y + 8);
  
  doc.setTextColor(...textLight);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const strengthText = report.strengths || 'No strengths noted.';
  const strengthLines = doc.splitTextToSize(strengthText, halfWidth - 14);
  doc.text(strengthLines.slice(0, 3), margin + 8, y + 14);
  
  // Areas to Improve card (right)
  drawRoundedRect(doc, margin + halfWidth + 4, y, halfWidth, obsCardHeight, 3, bgCard);
  doc.setFillColor(...redColor);
  doc.rect(margin + halfWidth + 4, y, 3, obsCardHeight, 'F');
  
  doc.setTextColor(...redColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('✕ Areas to Improve', margin + halfWidth + 12, y + 8);
  
  doc.setTextColor(...textLight);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const weaknessText = report.weaknesses || 'No areas noted.';
  const weaknessLines = doc.splitTextToSize(weaknessText, halfWidth - 14);
  doc.text(weaknessLines.slice(0, 3), margin + halfWidth + 12, y + 14);
  
  y += obsCardHeight + 6;

  // ========== RECOMMENDATION ==========
  drawRoundedRect(doc, margin, y, contentWidth, 22, 3, bgCard);
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, 3, 22, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('⚙ Recommendation', margin + 8, y + 8);
  
  doc.setTextColor(...white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const recText = report.recommendation || 'No recommendation provided.';
  const recLines = doc.splitTextToSize(recText, contentWidth - 16);
  doc.text(recLines.slice(0, 2), margin + 8, y + 14);
  
  y += 26;

  // ========== FOOTER ==========
  doc.setFontSize(6);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('The Football Scout', margin, pageHeight - 8);
  doc.text(`Report ID: ${report.id.substring(0, 8)}  •  ${format(new Date(report.match_date), 'MMMM d, yyyy')}`, pageWidth - margin, pageHeight - 8, { align: 'right' });

  // Save
  const filename = `scouting_report_${player?.full_name?.replace(/\s+/g, '_') || 'unknown'}_${format(new Date(report.match_date), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}