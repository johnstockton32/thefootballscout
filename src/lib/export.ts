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

// Helper to convert hex color to RGB tuple
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

interface BrandingOptions {
  logo_url?: string | null;
  company_name?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  show_default_branding?: boolean;
}

// PDF Export Function - Matching app's color scheme
export async function exportReportPDF(reportId: string, teamLogoUrl?: string | null, branding?: BrandingOptions | null) {
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
  
  // Color scheme — professional football green palette
  const brandPrimary = branding?.primary_color ? hexToRgb(branding.primary_color) : null;
  
  const bgDark: [number, number, number] = [255, 255, 255]; // White background
  const bgCard: [number, number, number] = [245, 247, 250]; // Light gray card
  const bgMuted: [number, number, number] = [228, 232, 238]; // Muted gray
  const primaryColor: [number, number, number] = brandPrimary || [38, 140, 105]; // Football green (hsl 152 55% 38%)
  const primaryLight: [number, number, number] = brandPrimary 
    ? [Math.min(brandPrimary[0] + 31, 255), Math.min(brandPrimary[1] + 16, 255), Math.min(brandPrimary[2] + 20, 255)]
    : [64, 163, 128]; // Lighter green
  const primaryDark: [number, number, number] = brandPrimary
    ? [Math.max(brandPrimary[0] - 20, 0), Math.max(brandPrimary[1] - 20, 0), Math.max(brandPrimary[2] - 20, 0)]
    : [25, 110, 80]; // Dark green
  const accentColor: [number, number, number] = [210, 155, 15]; // Gold
  const blueColor: [number, number, number] = [59, 130, 246]; // Blue for tactical
  const purpleColor: [number, number, number] = [140, 70, 210]; // Purple for mental
  const destructiveColor: [number, number, number] = [200, 45, 45]; // Red
  const white: [number, number, number] = [18, 22, 28]; // Dark text
  const textMuted: [number, number, number] = [100, 110, 125]; // Muted text
  const textLight: [number, number, number] = [60, 65, 75]; // Medium text

  // Calculate category averages
  const techValues = [report.technical_first_touch, report.technical_passing, report.technical_dribbling, report.technical_shooting, report.technical_crossing, report.technical_heading].filter(v => v != null);
  const tactValues = [report.tactical_positioning, report.tactical_decision_making, report.tactical_awareness, report.tactical_off_ball_movement, report.tactical_defensive_contribution].filter(v => v != null);
  const physValues = [report.physical_pace, report.physical_agility, report.physical_strength, report.physical_stamina, report.physical_balance].filter(v => v != null);
  const mentValues = [report.mental_composure, report.mental_concentration, report.mental_work_rate, report.mental_leadership, report.mental_aggression].filter(v => v != null);

  const techAvg = techValues.length > 0 ? Math.round(techValues.reduce((a, b) => a + b, 0) / techValues.length) : 0;
  const tactAvg = tactValues.length > 0 ? Math.round(tactValues.reduce((a, b) => a + b, 0) / tactValues.length) : 0;
  const physAvg = physValues.length > 0 ? Math.round(physValues.reduce((a, b) => a + b, 0) / physValues.length) : 0;
  const mentAvg = mentValues.length > 0 ? Math.round(mentValues.reduce((a, b) => a + b, 0) / mentValues.length) : 0;

  const categoryCount = [techAvg, tactAvg, physAvg, mentAvg].filter(v => v > 0).length;
  const overallScore = categoryCount > 0 ? Math.round(((techAvg + tactAvg + physAvg + mentAvg) / categoryCount) * 5) : 0;

  // ========== PAGE BACKGROUND ==========
  doc.setFillColor(...bgDark);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // ========== TOP ACCENT BAR ==========
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 3, 'F');

  let y = 8;

  // ========== HEADER — Logo + Team on left, Player info center-right ==========
  const logoUrl = teamLogoUrl || branding?.logo_url;
  let headerLogoWidth = 0;
  
  if (logoUrl) {
    const logoBase64 = await loadImageAsBase64(logoUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, y, 16, 16);
        headerLogoWidth = 20;
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }
  }

  // Team/club name below or beside logo
  const teamName = player?.current_club || branding?.company_name || '';
  const infoStartX = margin + headerLogoWidth;
  
  if (teamName) {
    doc.setTextColor(...primaryDark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(teamName.toUpperCase(), infoStartX, y + 5);
  }

  // "SCOUTING REPORT" label
  doc.setTextColor(...textMuted);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('SCOUTING REPORT', infoStartX, y + (teamName ? 10 : 5));

  // Player name — large
  doc.setTextColor(...white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(player?.full_name || 'Unknown Player', infoStartX, y + (teamName ? 18 : 13));
  
  // Position
  const position = player?.position ? POSITION_LABELS[player.position as PlayerPosition] : 'Unknown';
  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(position, infoStartX, y + (teamName ? 24 : 19));

  // Overall rating badge — right side
  if (report.overall_rating || overallScore > 0) {
    const badgeX = pageWidth - margin - 18;
    const badgeY = y + 2;
    const rating = report.overall_rating ? Math.round(report.overall_rating) : overallScore;
    
    // Rating circle
    drawRoundedRect(doc, badgeX, badgeY, 18, 18, 4, primaryColor);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(rating.toString(), badgeX + 9, badgeY + 12, { align: 'center' });
    
    doc.setTextColor(...textMuted);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text('RATING', badgeX + 9, badgeY + 22, { align: 'center' });
  }

  // Branding company name (top right if different from team)
  if (branding?.company_name && branding.company_name !== teamName) {
    doc.setTextColor(...textMuted);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.text(branding.company_name, pageWidth - margin, y + 28, { align: 'right' });
  }

  y += 30;

  // Separator line
  doc.setDrawColor(...bgMuted);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ========== MATCH DETAILS CARD ==========
  const matchCardHeight = 22;
  drawRoundedRect(doc, margin, y, contentWidth, matchCardHeight, 3, bgCard);
  
  // Match info row
  const matchDate = format(new Date(report.match_date), 'MMM d, yyyy');
  const opposition = report.opposition || 'Unknown Opposition';
  const competitionLevel = COMPETITION_LEVEL_LABELS[report.competition_level as CompetitionLevel] || report.competition_level;
  const minutesObserved = report.minutes_observed;
  
  // Left side - Match info
  doc.setTextColor(...primaryColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('MATCH', margin + 8, y + 7);
  
  doc.setTextColor(...white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${matchDate} vs ${opposition}`, margin + 8, y + 14);
  
  doc.setTextColor(...textMuted);
  doc.setFontSize(7);
  const matchContext = [competitionLevel];
  if (minutesObserved) matchContext.push(`${minutesObserved} mins`);
  doc.text(matchContext.join(' • '), margin + 8, y + 20);

  y += matchCardHeight + 4;

  // ========== OVERALL RATING CARD ==========
  const ratingCardHeight = 32;
  drawRoundedRect(doc, margin, y, contentWidth, ratingCardHeight, 4, bgCard);
  
  // Left side - rating info
  doc.setTextColor(...textMuted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('OVERALL RATING', margin + 8, y + 8);
  
  // Large score number
  doc.setTextColor(...white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(overallScore.toString(), margin + 8, y + 24);
  
  doc.setTextColor(...textMuted);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('/100', margin + 28, y + 24);
  
  // Score label
  doc.setTextColor(...primaryColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(getScoreLabel(overallScore), margin + 48, y + 24);

  // Potential rating (if available)
  if (report.potential_rating) {
    const potX = margin + 90;
    doc.setTextColor(...textMuted);
    doc.setFontSize(7);
    doc.text('POTENTIAL', potX, y + 8);
    doc.setTextColor(...accentColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(report.potential_rating.toString(), potX, y + 22);
    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('/100', potX + 15, y + 22);
  }

  // Right side - circular rating indicator
  const circleX = pageWidth - margin - 20;
  const circleY = y + 16;
  const circleR = 10;
  
  // Background circle
  doc.setDrawColor(...bgMuted);
  doc.setLineWidth(2);
  doc.circle(circleX, circleY, circleR, 'S');
  
  // Progress arc
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.circle(circleX, circleY, circleR, 'S');
  
  // Score in circle
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(overallScore.toString(), circleX, circleY + 3, { align: 'center' });

  y += ratingCardHeight + 4;

  // ========== CATEGORY CARDS ROW ==========
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 24;
  
  const categories = [
    { name: 'Technical', avg: techAvg, color: primaryColor },
    { name: 'Tactical', avg: tactAvg, color: blueColor },
    { name: 'Physical', avg: physAvg, color: accentColor },
    { name: 'Mental', avg: mentAvg, color: purpleColor },
  ];
  
  categories.forEach((cat, i) => {
    const cardX = margin + i * (cardWidth + 3);
    drawRoundedRect(doc, cardX, y, cardWidth, cardHeight, 3, bgCard);
    
    // Color indicator bar at top
    doc.setFillColor(...cat.color);
    doc.roundedRect(cardX + 3, y + 2, cardWidth - 6, 2, 1, 1, 'F');
    
    // Category name
    doc.setTextColor(...cat.color);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.name, cardX + cardWidth / 2, y + 10, { align: 'center' });
    
    // Score
    doc.setTextColor(...white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.avg.toString(), cardX + cardWidth / 2 - 3, y + 19);
    doc.setTextColor(...textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('/20', cardX + cardWidth / 2 + 6, y + 19);
  });
  
  y += cardHeight + 4;

  // ========== DETAILED ATTRIBUTES SECTION ==========
  const attrSectionHeight = 90;
  drawRoundedRect(doc, margin, y, contentWidth, attrSectionHeight, 4, bgCard);
  
  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Attributes', margin + 8, y + 10);
  
  // Attribute layout - 2 columns
  const colWidth = (contentWidth - 16) / 2;
  const leftColX = margin + 8;
  const rightColX = margin + 8 + colWidth + 4;
  const attrBarWidth = 38;
  const attrBarHeight = 2.5;
  let leftY = y + 17;
  let rightY = y + 17;
  const attrRowHeight = 6;

  // Helper to draw attribute row
  const drawAttributeRow = (x: number, attrY: number, name: string, value: number | null, color: [number, number, number]) => {
    const val = value || 0;
    doc.setTextColor(...textLight);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(name, x, attrY);
    
    // Progress bar
    const barX = x + 28;
    doc.setFillColor(...bgMuted);
    doc.roundedRect(barX, attrY - 2, attrBarWidth, attrBarHeight, 1, 1, 'F');
    if (val > 0) {
      doc.setFillColor(...color);
      doc.roundedRect(barX, attrY - 2, (val / 20) * attrBarWidth, attrBarHeight, 1, 1, 'F');
    }
    
    // Value
    doc.setTextColor(...white);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(val.toString(), barX + attrBarWidth + 2, attrY);
  };

  // TECHNICAL (left column)
  doc.setTextColor(...primaryColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Technical', leftColX, leftY);
  leftY += 5;
  
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
  leftY += 1;
  doc.setTextColor(...accentColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Physical', leftColX, leftY);
  leftY += 5;
  
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
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Tactical', rightColX, rightY);
  rightY += 5;
  
  const tacticalAttrs: [string, number | null][] = [
    ['Positioning', report.tactical_positioning],
    ['Decision', report.tactical_decision_making],
    ['Awareness', report.tactical_awareness],
    ['Off-Ball', report.tactical_off_ball_movement],
    ['Def. Contrib.', report.tactical_defensive_contribution],
  ];
  
  tacticalAttrs.forEach(([name, value]) => {
    drawAttributeRow(rightColX, rightY, name, value, blueColor);
    rightY += attrRowHeight;
  });

  // MENTAL (right column, continued)
  rightY += 1;
  doc.setTextColor(...purpleColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Mental', rightColX, rightY);
  rightY += 5;
  
  const mentalAttrs: [string, number | null][] = [
    ['Composure', report.mental_composure],
    ['Focus', report.mental_concentration],
    ['Work Rate', report.mental_work_rate],
    ['Leadership', report.mental_leadership],
    ['Aggression', report.mental_aggression],
  ];
  
  mentalAttrs.forEach(([name, value]) => {
    drawAttributeRow(rightColX, rightY, name, value, purpleColor);
    rightY += attrRowHeight;
  });
  
  y += attrSectionHeight + 4;

  // ========== STRENGTHS & AREAS TO IMPROVE ==========
  const halfWidth = (contentWidth - 4) / 2;
  const observationCardHeight = 28;
  
  // Strengths card (left)
  drawRoundedRect(doc, margin, y, halfWidth, observationCardHeight, 3, bgCard);
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, 2.5, observationCardHeight, 3, 0, 'F');
  doc.rect(margin + 1.5, y, 1, observationCardHeight, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('STRENGTHS', margin + 6, y + 7);
  
  doc.setTextColor(...textLight);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  const strengthText = report.strengths || 'No strengths noted.';
  const strengthLines = doc.splitTextToSize(strengthText, halfWidth - 10);
  doc.text(strengthLines.slice(0, 5).join('\n'), margin + 6, y + 13);
  
  // Areas to Improve card (right)
  drawRoundedRect(doc, margin + halfWidth + 4, y, halfWidth, observationCardHeight, 3, bgCard);
  doc.setFillColor(...destructiveColor);
  doc.roundedRect(margin + halfWidth + 4, y, 2.5, observationCardHeight, 3, 0, 'F');
  doc.rect(margin + halfWidth + 5.5, y, 1, observationCardHeight, 'F');
  
  doc.setTextColor(...destructiveColor);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('AREAS TO IMPROVE', margin + halfWidth + 10, y + 7);
  
  doc.setTextColor(...textLight);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  const weaknessText = report.weaknesses || 'No areas noted.';
  const weaknessLines = doc.splitTextToSize(weaknessText, halfWidth - 10);
  doc.text(weaknessLines.slice(0, 5).join('\n'), margin + halfWidth + 10, y + 13);
  
  y += observationCardHeight + 4;

  // ========== RECOMMENDATION ==========
  const recCardHeight = 18;
  drawRoundedRect(doc, margin, y, contentWidth, recCardHeight, 3, bgCard);
  doc.setFillColor(...primaryLight);
  doc.roundedRect(margin, y, 2.5, recCardHeight, 3, 0, 'F');
  doc.rect(margin + 1.5, y, 1, recCardHeight, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDATION', margin + 6, y + 7);
  
  // Recommendation badge
  const recBadge = report.recommendation || 'No recommendation';
  let badgeColor = textMuted;
  if (recBadge.toLowerCase().includes('sign')) badgeColor = primaryColor;
  else if (recBadge.toLowerCase().includes('monitor')) badgeColor = accentColor;
  else if (recBadge.toLowerCase().includes('reject') || recBadge.toLowerCase().includes('pass')) badgeColor = destructiveColor;
  
  doc.setTextColor(...badgeColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(recBadge, margin + 6, y + 14);

  // ========== FOOTER ==========
  // Bottom accent bar
  const footerAccentColor = branding?.primary_color ? hexToRgb(branding.primary_color) || primaryColor : primaryColor;
  doc.setFillColor(...footerAccentColor);
  doc.rect(0, pageHeight - 6, pageWidth, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');

  const showDefault = branding?.show_default_branding !== false;
  const footerLeft = branding?.company_name || (showDefault ? 'The Football Scout' : '');
  if (footerLeft) {
    doc.text(footerLeft, margin, pageHeight - 2);
  }
  
  const reportInfo = `${format(new Date(), 'MMM d, yyyy')} • Confidential`;
  doc.text(reportInfo, pageWidth - margin, pageHeight - 2, { align: 'right' });

  // Save
  const filename = `scouting_report_${player?.full_name?.replace(/\s+/g, '_') || 'unknown'}_${format(new Date(report.match_date), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}