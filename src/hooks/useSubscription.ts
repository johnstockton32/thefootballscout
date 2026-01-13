import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchSubscriptionData = async () => {
      setIsLoading(true);
      try {
        // Fetch user's subscription tier
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (profile?.subscription_tier) {
          setTier(profile.subscription_tier as SubscriptionTier);
        }

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
    };

    fetchSubscriptionData();
  }, [user]);

  const limits = TIER_LIMITS[tier];

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
  };
}
