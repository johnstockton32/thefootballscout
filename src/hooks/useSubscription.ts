import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  TIER_LIMITS, 
  type SubscriptionTier, 
  type SubscriptionLimits 
} from '@/constants/subscription';

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
  createCheckout: (tier: SubscriptionTier, isAnnual?: boolean, promoCode?: string) => Promise<void>;
  isSubscribedViaStripe: boolean;
}

// Re-export for backward compatibility
export type { SubscriptionTier } from '@/constants/subscription';

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

      setCanStartTrial(
        profile?.subscription_tier === 'free' && 
        profile?.trial_ends_at === null
      );

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

  const createCheckout = async (checkoutTier: SubscriptionTier, isAnnual: boolean = false, promoCode?: string): Promise<void> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    
    if (!accessToken) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (checkoutTier === 'free') {
      toast.error('Free tier does not require payment');
      return;
    }

    try {
      console.log('[Checkout] Creating checkout session', { tier: checkoutTier, isAnnual, promoCode });
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: checkoutTier, isAnnual, promoCode },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('[Checkout] Response', { data, error });

      if (error) {
        console.error('[Checkout] Function error:', error);
        throw new Error(error.message || 'Checkout failed');
      }

      if (data?.error) {
        console.error('[Checkout] API error:', data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        console.log('[Checkout] Redirecting to:', data.url);
        // Use window.open as primary method - works in all environments including iframes
        const opened = window.open(data.url, '_self');
        if (!opened) {
          // Fallback: try new tab if same-window open was blocked
          window.open(data.url, '_blank');
        }
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('[Checkout] Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      toast.error(message + '. Please try again.');
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
        window.open(data.url, '_blank') || (window.location.href = data.url);
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
    
    if (isSubscribedViaStripe) {
      await openCustomerPortal();
      return true;
    }
    
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
