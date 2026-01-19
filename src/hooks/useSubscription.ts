import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  hasBulkImportExport: boolean;
  hasVoiceToText: boolean;
  hasSmartDiscovery: boolean;
  hasPushNotifications: boolean;
  hasCustomAttributeWeights: boolean;
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
  subscriptionEndsAt: Date | null;
  canStartTrial: boolean;
  startTrial: () => Promise<boolean>;
  upgradePlan: (tier: SubscriptionTier) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  createCheckout: (tier: SubscriptionTier, isAnnual?: boolean) => Promise<void>;
  isSubscribedViaStripe: boolean;
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
};

export function useSubscription(): SubscriptionData {
  const { user, session } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [playerCount, setPlayerCount] = useState(0);
  const [monthlyReportCount, setMonthlyReportCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [subscriptionStartedAt, setSubscriptionStartedAt] = useState<Date | null>(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<Date | null>(null);
  const [canStartTrial, setCanStartTrial] = useState(false);
  const [isSubscribedViaStripe, setIsSubscribedViaStripe] = useState(false);

  const checkStripeSubscription = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking Stripe subscription:', error);
        return;
      }

      if (data) {
        if (data.tier && data.tier !== 'free') {
          setTier(data.tier as SubscriptionTier);
          setIsSubscribedViaStripe(data.subscribed);
        }
        if (data.subscription_end) {
          setSubscriptionEndsAt(new Date(data.subscription_end));
        }
      }
    } catch (error) {
      console.error('Error invoking check-subscription:', error);
    }
  }, [session?.access_token]);

  const fetchSubscriptionData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch user's subscription tier from profile
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

      // Check Stripe subscription status
      await checkStripeSubscription();
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, checkStripeSubscription]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Periodically refresh subscription status (every 60 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkStripeSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, checkStripeSubscription]);

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

  const createCheckout = async (checkoutTier: SubscriptionTier, isAnnual: boolean = false): Promise<void> => {
    if (!session?.access_token) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (checkoutTier === 'free') {
      toast.error('Free tier does not require payment');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: checkoutTier, isAnnual },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open checkout in new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
    }
  };

  const openCustomerPortal = async (): Promise<void> => {
    if (!session?.access_token) {
      toast.error('Please sign in to manage subscription');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open portal in new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management. Please try again.');
    }
  };

  const upgradePlan = async (newTier: SubscriptionTier): Promise<boolean> => {
    if (!user) return false;
    
    // For Stripe subscribers, redirect to customer portal
    if (isSubscribedViaStripe) {
      await openCustomerPortal();
      return true;
    }
    
    // For non-Stripe users (trials, etc.), create new checkout
    if (newTier !== 'free') {
      await createCheckout(newTier);
      return true;
    }
    
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
    
    // For Stripe subscribers, redirect to customer portal
    if (isSubscribedViaStripe) {
      await openCustomerPortal();
      return true;
    }
    
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
    subscriptionEndsAt,
    canStartTrial,
    startTrial,
    upgradePlan,
    cancelSubscription,
    refreshSubscription: fetchSubscriptionData,
    openCustomerPortal,
    createCheckout,
    isSubscribedViaStripe,
  };
}
