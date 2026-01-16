import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionTier = 'free' | 'pro' | 'team';

interface SubscriptionLimits {
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
}

interface SubscriptionData {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  usage: {
    playerCount: number;
    monthlyReportCount: number;
  };
  canCreatePlayer: boolean;
  canCreateReport: boolean;
  isLoading: boolean;
  isInTrial: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  subscriptionStartedAt: Date | null;
  canStartTrial: boolean;
  startTrial: () => Promise<boolean>;
  upgradePlan: (tier: SubscriptionTier) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
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
    maxTeamMembers: Infinity,
  },
};

export function useSubscription(): SubscriptionData {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [playerCount, setPlayerCount] = useState(0);
  const [monthlyReportCount, setMonthlyReportCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [subscriptionStartedAt, setSubscriptionStartedAt] = useState<Date | null>(null);
  const [canStartTrial, setCanStartTrial] = useState(false);

  const fetchSubscriptionData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch user's subscription tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, trial_ends_at, subscription_started_at')
        .eq('id', user.id)
        .single();

      if (profile?.subscription_tier) {
        setTier(profile.subscription_tier as SubscriptionTier);
      }
      
      if (profile?.trial_ends_at) {
        setTrialEndsAt(new Date(profile.trial_ends_at));
      } else {
        setTrialEndsAt(null);
      }
      
      if (profile?.subscription_started_at) {
        setSubscriptionStartedAt(new Date(profile.subscription_started_at));
      } else {
        setSubscriptionStartedAt(null);
      }

      // Check if user can start a trial (free plan and no previous trial)
      setCanStartTrial(
        profile?.subscription_tier === 'free' && 
        profile?.trial_ends_at === null
      );

      // Fetch player count
      const { count: players } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('scout_id', user.id);

      setPlayerCount(players ?? 0);

      // Fetch monthly report count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: reports } = await supabase
        .from('scouting_reports')
        .select('*', { count: 'exact', head: true })
        .eq('scout_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      setMonthlyReportCount(reports ?? 0);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const startTrial = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('start_pro_trial', {
        _user_id: user.id
      });
      
      if (error) throw error;
      
      if (data) {
        await fetchSubscriptionData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error starting trial:', error);
      return false;
    }
  };

  const upgradePlan = async (newTier: SubscriptionTier): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('upgrade_subscription', {
        _user_id: user.id,
        _tier: newTier
      });
      
      if (error) throw error;
      
      if (data) {
        await fetchSubscriptionData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error upgrading plan:', error);
      return false;
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('cancel_subscription', {
        _user_id: user.id
      });
      
      if (error) throw error;
      
      if (data) {
        await fetchSubscriptionData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  };

  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const isInTrial = tier === 'pro' && trialEndsAt !== null && trialEndsAt > new Date();
  const canCreatePlayer = tier !== 'free' || playerCount < limits.maxPlayers;
  const canCreateReport = tier !== 'free' || monthlyReportCount < limits.maxReportsPerMonth;
  
  // Calculate trial days remaining
  const trialDaysRemaining = isInTrial && trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    tier,
    limits,
    usage: {
      playerCount,
      monthlyReportCount,
    },
    canCreatePlayer,
    canCreateReport,
    isLoading,
    isInTrial,
    trialEndsAt,
    trialDaysRemaining,
    subscriptionStartedAt,
    canStartTrial,
    startTrial,
    upgradePlan,
    cancelSubscription,
    refreshSubscription: fetchSubscriptionData,
  };
}
