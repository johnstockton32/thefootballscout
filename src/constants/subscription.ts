// Subscription tier limits and configuration
// Centralized business rules for feature gating

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'agency';

export interface SubscriptionLimits {
  maxPlayers: number;
  maxReportsPerMonth: number;
  maxComparisonPlayers: number;
  hasAdvancedAnalytics: boolean;
  hasPdfExport: boolean;
  hasTeamFeatures: boolean;
  hasAIInsights: boolean;
  hasVideoClips: boolean;
  hasWhiteLabel: boolean;
  maxTeamMembers: number;
  hasBulkImportExport: boolean;
  hasVoiceToText: boolean;
  hasSmartDiscovery: boolean;
  hasPushNotifications: boolean;
  hasCustomAttributeWeights: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxPlayers: 10,
    maxReportsPerMonth: 5,
    maxComparisonPlayers: 2,
    hasAdvancedAnalytics: false,
    hasPdfExport: false,
    hasTeamFeatures: false,
    hasAIInsights: false,
    hasVideoClips: false,
    hasWhiteLabel: false,
    maxTeamMembers: 1,
    hasBulkImportExport: false,
    hasVoiceToText: false,
    hasSmartDiscovery: false,
    hasPushNotifications: false,
    hasCustomAttributeWeights: false,
  },
  pro: {
    maxPlayers: Infinity,
    maxReportsPerMonth: Infinity,
    maxComparisonPlayers: 5,
    hasAdvancedAnalytics: true,
    hasPdfExport: true,
    hasTeamFeatures: false,
    hasAIInsights: true,
    hasVideoClips: false,
    hasWhiteLabel: false,
    maxTeamMembers: 1,
    hasBulkImportExport: true,
    hasVoiceToText: true,
    hasSmartDiscovery: true,
    hasPushNotifications: false,
    hasCustomAttributeWeights: true,
  },
  team: {
    maxPlayers: Infinity,
    maxReportsPerMonth: Infinity,
    maxComparisonPlayers: 10,
    hasAdvancedAnalytics: true,
    hasPdfExport: true,
    hasTeamFeatures: true,
    hasAIInsights: true,
    hasVideoClips: true,
    hasWhiteLabel: true,
    maxTeamMembers: 10,
    hasBulkImportExport: true,
    hasVoiceToText: true,
    hasSmartDiscovery: true,
    hasPushNotifications: true,
    hasCustomAttributeWeights: true,
  },
  agency: {
    maxPlayers: Infinity,
    maxReportsPerMonth: Infinity,
    maxComparisonPlayers: 20,
    hasAdvancedAnalytics: true,
    hasPdfExport: true,
    hasTeamFeatures: true,
    hasAIInsights: true,
    hasVideoClips: true,
    hasWhiteLabel: true,
    maxTeamMembers: 50,
    hasBulkImportExport: true,
    hasVoiceToText: true,
    hasSmartDiscovery: true,
    hasPushNotifications: true,
    hasCustomAttributeWeights: true,
  },
};

// Pricing configuration (in GBP)
export const PRICING = {
  pro: {
    monthly: 10,
    annual: 100, // ~17% discount
  },
  team: {
    monthly: 99,
    annual: 990, // ~17% discount
    licensePackPrice: 60, // 10 additional licenses
    licensesPerPack: 10,
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
  hasTeamFeatures: 'Team Collaboration',
  hasAIInsights: 'AI Insights',
  hasVideoClips: 'Video Clips',
  hasWhiteLabel: 'White Label',
  maxTeamMembers: 'Team Members',
  hasBulkImportExport: 'Bulk Import/Export',
  hasVoiceToText: 'Voice to Text',
  hasSmartDiscovery: 'Smart Discovery',
  hasPushNotifications: 'Push Notifications',
  hasCustomAttributeWeights: 'Custom Attribute Weights',
};
