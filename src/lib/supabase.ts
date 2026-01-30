import { supabase } from "@/integrations/supabase/client";
import { 
  POSITION_LABELS, 
  POSITION_ABBREV, 
  POSITION_WEIGHTS,
  COMPETITION_LEVEL_LABELS,
  type PlayerPosition,
  type CompetitionLevel,
} from "@/constants/positions";

// Re-export supabase client for backward compatibility
export { supabase };

// Re-export types and constants from centralized location
export type { PlayerPosition, CompetitionLevel };
export { POSITION_LABELS, POSITION_ABBREV, POSITION_WEIGHTS, COMPETITION_LEVEL_LABELS };

// Re-export AppRole type
export type AppRole = 'scout' | 'admin';

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
