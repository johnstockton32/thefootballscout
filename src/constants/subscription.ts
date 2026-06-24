// Single-user mode: payments removed. Tier kept only to satisfy types.

export type SubscriptionTier = 'free' | 'pro';

export interface SubscriptionLimits {
  maxPlayers: number;
  maxReportsPerMonth: number;
  maxComparisonPlayers: number;
  hasAdvancedAnalytics: boolean;
  hasPdfExport: boolean;
  hasAIInsights: boolean;
  hasBulkImportExport: boolean;
  hasVoiceToText: boolean;
  hasSmartDiscovery: boolean;
  hasCustomAttributeWeights: boolean;
}

const UNLIMITED: SubscriptionLimits = {
  maxPlayers: Infinity,
  maxReportsPerMonth: Infinity,
  maxComparisonPlayers: 10,
  hasAdvancedAnalytics: true,
  hasPdfExport: true,
  hasAIInsights: true,
  hasBulkImportExport: true,
  hasVoiceToText: true,
  hasSmartDiscovery: true,
  hasCustomAttributeWeights: true,
};

export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: UNLIMITED,
  pro: UNLIMITED,
};

export const PRICING = { pro: { monthly: 0, annual: 0 } } as const;
export const TRIAL_CONFIG = { durationDays: 0, tier: 'pro' as SubscriptionTier } as const;

export const FEATURE_NAMES: Record<keyof SubscriptionLimits, string> = {
  maxPlayers: 'Player Profiles',
  maxReportsPerMonth: 'Monthly Reports',
  maxComparisonPlayers: 'Player Comparison',
  hasAdvancedAnalytics: 'Advanced Analytics',
  hasPdfExport: 'PDF Export',
  hasAIInsights: 'AI Insights',
  hasBulkImportExport: 'Bulk Import/Export',
  hasVoiceToText: 'Voice to Text',
  hasSmartDiscovery: 'Smart Discovery',
  hasCustomAttributeWeights: 'Custom Attribute Weights',
};
