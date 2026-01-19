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

// PDF Export Function - Matching app's color scheme
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
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  // App color scheme (converted from HSL to RGB)
  // Primary: hsl(158 64% 45%) = Emerald green
  // Background: hsl(220 20% 8%) = Dark charcoal
  // Card: hsl(220 18% 12%) = Slightly lighter charcoal
  // Accent: hsl(38 92% 50%) = Amber gold
  
  const bgDark: [number, number, number] = [18, 21, 26]; // --background: 220 20% 8%
  const bgCard: [number, number, number] = [25, 30, 38]; // --card: 220 18% 12%
  const bgMuted: [number, number, number] = [35, 40, 48]; // --muted: 220 15% 18%
  const primaryColor: [number, number, number] = [41, 171, 135]; // --primary: 158 64% 45% (emerald)
  const primaryLight: [number, number, number] = [72, 187, 155]; // Lighter emerald
  const accentColor: [number, number, number] = [243, 172, 18]; // --accent: 38 92% 50% (amber)
  const blueColor: [number, number, number] = [59, 130, 246]; // Blue for tactical
  const purpleColor: [number, number, number] = [168, 85, 247]; // Purple for mental
  const destructiveColor: [number, number, number] = [239, 68, 68]; // --destructive: red
  const white: [number, number, number] = [240, 242, 245]; // --foreground
  const textMuted: [number, number, number] = [120, 130, 145]; // --muted-foreground
  const textLight: [number, number, number] = [200, 205, 215];

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

  // ========== PAGE BACKGROUND ==========
  doc.setFillColor(...bgDark);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let y = margin;

  // ========== HEADER SECTION ==========
  // Team logo (if available)
  if (teamLogoUrl) {
    const logoBase64 = await loadImageAsBase64(teamLogoUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', pageWidth - margin - 15, y, 14, 14);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }
  }

  // Player name
  doc.setTextColor(...white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(player?.full_name || 'Unknown Player', margin, y + 8);
  
  // Position and club
  const position = player?.position ? POSITION_LABELS[player.position as PlayerPosition] : 'Unknown';
  const club = player?.current_club || 'Unknown Club';
  doc.setTextColor(...textMuted);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${position} • ${club}`, margin, y + 16);

  y += 24;

  // ========== MATCH DETAILS CARD ==========
  const matchCardHeight = 28;
  drawRoundedRect(doc, margin, y, contentWidth, matchCardHeight, 4, bgCard);
  
  // Match info row
  const matchDate = format(new Date(report.match_date), 'MMMM d, yyyy');
  const opposition = report.opposition || 'Unknown Opposition';
  const competitionLevel = COMPETITION_LEVEL_LABELS[report.competition_level as CompetitionLevel] || report.competition_level;
  const minutesObserved = report.minutes_observed;
  const matchDetails = report.match_details;
  
  // Left side - Match info
  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('MATCH DETAILS', margin + 10, y + 8);
  
  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${matchDate} vs ${opposition}`, margin + 10, y + 17);
  
  doc.setTextColor(...textMuted);
  doc.setFontSize(8);
  const matchContext = [competitionLevel];
  if (minutesObserved) matchContext.push(`${minutesObserved} mins observed`);
  doc.text(matchContext.join(' • '), margin + 10, y + 24);
  
  // Right side - Match context (if available)
  if (matchDetails) {
    const detailsX = margin + contentWidth / 2 + 5;
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('MATCH CONTEXT', detailsX, y + 8);
    
    doc.setTextColor(...textLight);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const contextLines = doc.splitTextToSize(matchDetails, contentWidth / 2 - 15);
    doc.text(contextLines.slice(0, 2).join('\n'), detailsX, y + 16);
  }

  y += matchCardHeight + 6;

  // ========== OVERALL RATING CARD ==========
  const ratingCardHeight = 40;
  drawRoundedRect(doc, margin, y, contentWidth, ratingCardHeight, 6, bgCard);
  
  // Left side - rating info
  doc.setTextColor(...textMuted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('OVERALL RATING', margin + 10, y + 10);
  
  // Large score number
  doc.setTextColor(...white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(overallScore.toString(), margin + 10, y + 30);
  
  doc.setTextColor(...textMuted);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('/100', margin + 34, y + 30);
  
  // Score label
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(getScoreLabel(overallScore), margin + 52, y + 30);

  // Potential rating (if available)
  if (report.potential_rating) {
    const potX = margin + 95;
    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.text('POTENTIAL', potX, y + 10);
    doc.setTextColor(...accentColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(report.potential_rating.toString(), potX, y + 26);
    doc.setTextColor(...textMuted);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('/100', potX + 18, y + 26);
  }

  // Right side - circular rating indicator
  const circleX = pageWidth - margin - 25;
  const circleY = y + 20;
  const circleR = 12;
  
  // Background circle
  doc.setDrawColor(...bgMuted);
  doc.setLineWidth(3);
  doc.circle(circleX, circleY, circleR, 'S');
  
  // Progress arc
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(3);
  doc.circle(circleX, circleY, circleR, 'S');
  
  // Score in circle
  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(overallScore.toString(), circleX, circleY + 4, { align: 'center' });

  y += ratingCardHeight + 6;

  // ========== CATEGORY CARDS ROW ==========
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 28;
  
  const categories = [
    { name: 'Technical', avg: techAvg, color: primaryColor },
    { name: 'Tactical', avg: tactAvg, color: blueColor },
    { name: 'Physical', avg: physAvg, color: accentColor },
    { name: 'Mental', avg: mentAvg, color: purpleColor },
  ];
  
  categories.forEach((cat, i) => {
    const cardX = margin + i * (cardWidth + 3);
    drawRoundedRect(doc, cardX, y, cardWidth, cardHeight, 4, bgCard);
    
    // Color indicator bar at top
    doc.setFillColor(...cat.color);
    doc.roundedRect(cardX + 3, y + 3, cardWidth - 6, 2, 1, 1, 'F');
    
    // Category name
    doc.setTextColor(...cat.color);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.name, cardX + cardWidth / 2, y + 12, { align: 'center' });
    
    // Score
    doc.setTextColor(...white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.avg.toString(), cardX + cardWidth / 2 - 4, y + 22);
    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('/20', cardX + cardWidth / 2 + 6, y + 22);
  });
  
  y += cardHeight + 6;

  // ========== DETAILED ATTRIBUTES SECTION ==========
  const attrSectionHeight = 105;
  drawRoundedRect(doc, margin, y, contentWidth, attrSectionHeight, 6, bgCard);
  
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Attributes', margin + 10, y + 11);
  
  // Attribute layout - 2 columns
  const colWidth = (contentWidth - 20) / 2;
  const leftColX = margin + 10;
  const rightColX = margin + 10 + colWidth + 5;
  const attrBarWidth = 42;
  const attrBarHeight = 3;
  let leftY = y + 20;
  let rightY = y + 20;
  const attrRowHeight = 7;

  // Helper to draw attribute row
  const drawAttributeRow = (x: number, attrY: number, name: string, value: number | null, color: [number, number, number]) => {
    const val = value || 0;
    doc.setTextColor(...textLight);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(name, x, attrY);
    
    // Progress bar
    const barX = x + 32;
    doc.setFillColor(...bgMuted);
    doc.roundedRect(barX, attrY - 2.5, attrBarWidth, attrBarHeight, 1.5, 1.5, 'F');
    if (val > 0) {
      doc.setFillColor(...color);
      doc.roundedRect(barX, attrY - 2.5, (val / 20) * attrBarWidth, attrBarHeight, 1.5, 1.5, 'F');
    }
    
    // Value
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(val.toString(), barX + attrBarWidth + 3, attrY);
  };

  // TECHNICAL (left column)
  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Technical', leftColX, leftY);
  leftY += 6;
  
  const technicalAttrs: [string, number | null][] = [
    ['First Touch', report.technical_first_touch],
    ['Passing', report.technical_passing],
    ['Dribbling', report.technical_dribbling],
    ['Shooting', report.technical_shooting],
    ['Crossing', report.technical_crossing],
    ['Heading', report.technical_heading],
  ];
  
  technicalAttrs.forEach(([name, value]) => {
    drawAttributeRow(leftColX, leftY, name, value, primaryColor);
    leftY += attrRowHeight;
  });

  // PHYSICAL (left column, continued)
  leftY += 2;
  doc.setTextColor(...accentColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Physical', leftColX, leftY);
  leftY += 6;
  
  const physicalAttrs: [string, number | null][] = [
    ['Pace', report.physical_pace],
    ['Agility', report.physical_agility],
    ['Strength', report.physical_strength],
    ['Stamina', report.physical_stamina],
    ['Balance', report.physical_balance],
  ];
  
  physicalAttrs.forEach(([name, value]) => {
    drawAttributeRow(leftColX, leftY, name, value, accentColor);
    leftY += attrRowHeight;
  });

  // TACTICAL (right column)
  doc.setTextColor(...blueColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Tactical', rightColX, rightY);
  rightY += 6;
  
  const tacticalAttrs: [string, number | null][] = [
    ['Positioning', report.tactical_positioning],
    ['Decision Making', report.tactical_decision_making],
    ['Awareness', report.tactical_awareness],
    ['Off-Ball Move', report.tactical_off_ball_movement],
    ['Def. Contrib.', report.tactical_defensive_contribution],
  ];
  
  tacticalAttrs.forEach(([name, value]) => {
    drawAttributeRow(rightColX, rightY, name, value, blueColor);
    rightY += attrRowHeight;
  });

  // MENTAL (right column, continued)
  rightY += 2;
  doc.setTextColor(...purpleColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Mental', rightColX, rightY);
  rightY += 6;
  
  const mentalAttrs: [string, number | null][] = [
    ['Composure', report.mental_composure],
    ['Concentration', report.mental_concentration],
    ['Work Rate', report.mental_work_rate],
    ['Leadership', report.mental_leadership],
    ['Aggression', report.mental_aggression],
  ];
  
  mentalAttrs.forEach(([name, value]) => {
    drawAttributeRow(rightColX, rightY, name, value, purpleColor);
    rightY += attrRowHeight;
  });
  
  y += attrSectionHeight + 5;

  // ========== STRENGTHS & AREAS TO IMPROVE ==========
  const halfWidth = (contentWidth - 6) / 2;
  const observationCardHeight = 32;
  
  // Strengths card (left)
  drawRoundedRect(doc, margin, y, halfWidth, observationCardHeight, 4, bgCard);
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, 3, observationCardHeight, 4, 0, 'F');
  doc.rect(margin + 1.5, y, 1.5, observationCardHeight, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Strengths', margin + 8, y + 8);
  
  doc.setTextColor(...textLight);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const strengthText = report.strengths || 'No strengths noted.';
  const strengthLines = doc.splitTextToSize(strengthText, halfWidth - 14);
  doc.text(strengthLines.slice(0, 4).join('\n'), margin + 8, y + 15);
  
  // Areas to Improve card (right)
  drawRoundedRect(doc, margin + halfWidth + 6, y, halfWidth, observationCardHeight, 4, bgCard);
  doc.setFillColor(...destructiveColor);
  doc.roundedRect(margin + halfWidth + 6, y, 3, observationCardHeight, 4, 0, 'F');
  doc.rect(margin + halfWidth + 7.5, y, 1.5, observationCardHeight, 'F');
  
  doc.setTextColor(...destructiveColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Areas to Improve', margin + halfWidth + 14, y + 8);
  
  doc.setTextColor(...textLight);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const weaknessText = report.weaknesses || 'No areas noted.';
  const weaknessLines = doc.splitTextToSize(weaknessText, halfWidth - 14);
  doc.text(weaknessLines.slice(0, 4).join('\n'), margin + halfWidth + 14, y + 15);
  
  y += observationCardHeight + 5;

  // ========== RECOMMENDATION ==========
  const recCardHeight = 22;
  drawRoundedRect(doc, margin, y, contentWidth, recCardHeight, 4, bgCard);
  doc.setFillColor(...primaryLight);
  doc.roundedRect(margin, y, 3, recCardHeight, 4, 0, 'F');
  doc.rect(margin + 1.5, y, 1.5, recCardHeight, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommendation', margin + 8, y + 8);
  
  // Recommendation badge
  const recBadge = report.recommendation || 'No recommendation';
  let badgeColor = textMuted;
  if (recBadge.toLowerCase().includes('sign')) badgeColor = primaryColor;
  else if (recBadge.toLowerCase().includes('monitor')) badgeColor = accentColor;
  else if (recBadge.toLowerCase().includes('reject') || recBadge.toLowerCase().includes('pass')) badgeColor = destructiveColor;
  
  doc.setTextColor(...badgeColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(recBadge, margin + 8, y + 17);
  
  y += recCardHeight + 6;

  // ========== FOOTER ==========
  doc.setTextColor(...textMuted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('The Football Scout', margin, pageHeight - 10);
  
  const reportInfo = `Report ID: ${report.id.substring(0, 8)} • Generated ${format(new Date(), 'MMM d, yyyy')}`;
  doc.text(reportInfo, pageWidth - margin, pageHeight - 10, { align: 'right' });
  
  // Accent line at bottom
  doc.setFillColor(...primaryColor);
  doc.rect(margin, pageHeight - 6, contentWidth, 1, 'F');

  // Save
  const filename = `scouting_report_${player?.full_name?.replace(/\s+/g, '_') || 'unknown'}_${format(new Date(report.match_date), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}