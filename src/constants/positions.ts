// Position types and configuration
// Centralized constants for player positions

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
