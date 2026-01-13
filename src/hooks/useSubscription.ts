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
  },
  pro: {
    maxPlayers: Infinity,
    maxReportsPerMonth: Infinity,
    maxComparisonPlayers: 5,
    hasAdvancedAnalytics: true,
    hasPdfExport: true,
    hasTeamFeatures: false,
  },
  team: {
    maxPlayers: Infinity,
    maxReportsPerMonth: Infinity,
    maxComparisonPlayers: 5,
    hasAdvancedAnalytics: true,
    hasPdfExport: true,
    hasTeamFeatures: true,
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

  const limits = TIER_LIMITS[tier];
  const isInTrial = tier === 'pro' && trialEndsAt !== null && trialEndsAt > new Date();
  const canCreatePlayer = tier !== 'free' || playerCount < limits.maxPlayers;
  const canCreateReport = tier !== 'free' || monthlyReportCount < limits.maxReportsPerMonth;

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
    subscriptionStartedAt,
    canStartTrial,
    startTrial,
    upgradePlan,
    cancelSubscription,
    refreshSubscription: fetchSubscriptionData,
  };
}
