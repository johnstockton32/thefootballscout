import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TIER_LIMITS, type SubscriptionTier, type SubscriptionLimits } from '@/constants/subscription';

// Single-user mode: payments removed. Everyone is treated as "pro" with no limits.
export type { SubscriptionTier } from '@/constants/subscription';

interface SubscriptionData {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  usage: { playerCount: number; monthlyReportCount: number };
  canCreatePlayer: boolean;
  canCreateReport: boolean;
  isLoading: boolean;
  isInTrial: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  subscriptionStartedAt: Date | null;
  subscriptionEndsAt: Date | null;
  canStartTrial: boolean;
  startTrial: () => Promise<boolean>;
  upgradePlan: (tier: SubscriptionTier) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  createCheckout: (tier: SubscriptionTier, isAnnual?: boolean, promoCode?: string) => Promise<void>;
  isSubscribedViaStripe: boolean;
}

const noop = async () => {};

export function useSubscription(): SubscriptionData {
  const { user } = useAuth();
  const [playerCount, setPlayerCount] = useState(0);
  const [monthlyReportCount, setMonthlyReportCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { count: players } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('scout_id', user.id);
      setPlayerCount(players ?? 0);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count: reports } = await supabase
        .from('scouting_reports')
        .select('*', { count: 'exact', head: true })
        .eq('scout_id', user.id)
        .gte('created_at', startOfMonth.toISOString());
      setMonthlyReportCount(reports ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  return {
    tier: 'pro',
    limits: TIER_LIMITS.pro,
    usage: { playerCount, monthlyReportCount },
    canCreatePlayer: true,
    canCreateReport: true,
    isLoading,
    isInTrial: false,
    trialEndsAt: null,
    trialDaysRemaining: 0,
    subscriptionStartedAt: null,
    subscriptionEndsAt: null,
    canStartTrial: false,
    startTrial: async () => true,
    upgradePlan: async () => true,
    cancelSubscription: async () => true,
    refreshSubscription: fetchUsage,
    openCustomerPortal: noop,
    createCheckout: noop,
    isSubscribedViaStripe: false,
  };
}
