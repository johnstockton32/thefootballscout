import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Helper types for database
export type PlayerPosition = 
  | 'goalkeeper' 
  | 'centre_back' 
  | 'full_back' 
  | 'defensive_midfielder' 
  | 'central_midfielder' 
  | 'attacking_midfielder' 
  | 'winger' 
  | 'striker';

export type CompetitionLevel = 
  | 'amateur' 
  | 'semi_pro' 
  | 'professional' 
  | 'youth_academy' 
  | 'international';

export type AppRole = 'scout' | 'admin';

// Position display names
export const POSITION_LABELS: Record<PlayerPosition, string> = {
  goalkeeper: 'Goalkeeper',
  centre_back: 'Centre Back',
  full_back: 'Full Back',
  defensive_midfielder: 'Defensive Midfielder',
  central_midfielder: 'Central Midfielder',
  attacking_midfielder: 'Attacking Midfielder',
  winger: 'Winger',
  striker: 'Striker',
};

export const COMPETITION_LEVEL_LABELS: Record<CompetitionLevel, string> = {
  amateur: 'Amateur',
  semi_pro: 'Semi-Professional',
  professional: 'Professional',
  youth_academy: 'Youth Academy',
  international: 'International',
};

// Position abbreviations for UI
export const POSITION_ABBREV: Record<PlayerPosition, string> = {
  goalkeeper: 'GK',
  centre_back: 'CB',
  full_back: 'FB',
  defensive_midfielder: 'DM',
  central_midfielder: 'CM',
  attacking_midfielder: 'AM',
  winger: 'WG',
  striker: 'ST',
};

// Position-based attribute weights for overall rating calculation
export const POSITION_WEIGHTS: Record<PlayerPosition, {
  technical: number;
  tactical: number;
  physical: number;
  mental: number;
}> = {
  goalkeeper: { technical: 0.20, tactical: 0.25, physical: 0.25, mental: 0.30 },
  centre_back: { technical: 0.15, tactical: 0.30, physical: 0.30, mental: 0.25 },
  full_back: { technical: 0.25, tactical: 0.25, physical: 0.30, mental: 0.20 },
  defensive_midfielder: { technical: 0.25, tactical: 0.30, physical: 0.20, mental: 0.25 },
  central_midfielder: { technical: 0.30, tactical: 0.30, physical: 0.20, mental: 0.20 },
  attacking_midfielder: { technical: 0.35, tactical: 0.25, physical: 0.15, mental: 0.25 },
  winger: { technical: 0.35, tactical: 0.20, physical: 0.30, mental: 0.15 },
  striker: { technical: 0.30, tactical: 0.20, physical: 0.25, mental: 0.25 },
};

// Calculate overall rating (0-100) from attributes
export function calculateOverallRating(
  position: PlayerPosition,
  technical: number[],
  tactical: number[],
  physical: number[],
  mental: number[]
): number {
  const weights = POSITION_WEIGHTS[position];
  
  const avgTechnical = technical.reduce((a, b) => a + b, 0) / technical.length;
  const avgTactical = tactical.reduce((a, b) => a + b, 0) / tactical.length;
  const avgPhysical = physical.reduce((a, b) => a + b, 0) / physical.length;
  const avgMental = mental.reduce((a, b) => a + b, 0) / mental.length;
  
  // Normalize from 1-20 scale to 0-100
  const normalizedTechnical = ((avgTechnical - 1) / 19) * 100;
  const normalizedTactical = ((avgTactical - 1) / 19) * 100;
  const normalizedPhysical = ((avgPhysical - 1) / 19) * 100;
  const normalizedMental = ((avgMental - 1) / 19) * 100;
  
  const overall = 
    normalizedTechnical * weights.technical +
    normalizedTactical * weights.tactical +
    normalizedPhysical * weights.physical +
    normalizedMental * weights.mental;
  
  return Math.round(overall * 10) / 10;
}

// Get rating color class based on value (0-100)
export function getRatingColor(rating: number): string {
  if (rating >= 85) return 'text-status-success';
  if (rating >= 70) return 'text-pitch';
  if (rating >= 55) return 'text-rating';
  if (rating >= 40) return 'text-status-warning';
  return 'text-status-danger';
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
