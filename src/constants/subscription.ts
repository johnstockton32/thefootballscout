// Subscription tier limits and configuration
// Centralized business rules for feature gating

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

export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxPlayers: 10,
    maxReportsPerMonth: 5,
    maxComparisonPlayers: 2,
    hasAdvancedAnalytics: false,
    hasPdfExport: false,
    hasAIInsights: false,
    hasBulkImportExport: false,
    hasVoiceToText: false,
    hasSmartDiscovery: false,
    hasCustomAttributeWeights: false,
  },
  pro: {
    maxPlayers: Infinity,
    maxReportsPerMonth: Infinity,
    maxComparisonPlayers: 5,
    hasAdvancedAnalytics: true,
    hasPdfExport: true,
    hasAIInsights: true,
    hasBulkImportExport: true,
    hasVoiceToText: true,
    hasSmartDiscovery: true,
    hasCustomAttributeWeights: true,
  },
};

// Pricing configuration (in GBP)
export const PRICING = {
  pro: {
    monthly: 10,
    annual: 96, // £8/month
  },
} as const;

// Trial configuration
export const TRIAL_CONFIG = {
  durationDays: 14,
  tier: 'pro' as SubscriptionTier,
} as const;

// Feature display names for UI
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
