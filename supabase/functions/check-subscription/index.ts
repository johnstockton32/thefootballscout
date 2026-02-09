import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Map Stripe product IDs to subscription tiers (monthly and annual products)
const PRODUCT_TO_TIER: Record<string, string> = {
  "prod_TvF36xqkHghuBF": "pro",     // Pro Monthly
  "prod_TvF4Ye5zHm8jIi": "pro",     // Pro Annual
  "prod_TwkfUm5lSdM5cz": "pro",     // Welcome Launch Lifetime Pro
};

// Product IDs that represent lifetime (one-time) purchases
const LIFETIME_PRODUCTS = new Set(["prod_TwkfUm5lSdM5cz"]);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Safe date conversion helper
const safeTimestampToISO = (timestamp: number | undefined | null): string | null => {
  if (!timestamp || typeof timestamp !== 'number') return null;
  try {
    return new Date(timestamp * 1000).toISOString();
  } catch {
    return null;
  }
};

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Service role client for DB operations
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");

    // Use getClaims for signing-keys compatibility
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) throw new Error(`Authentication error: ${claimsError?.message || 'Invalid token'}`);
    
    const userId = claims.claims.sub as string;
    const userEmail = claims.claims.email as string;
    if (!userEmail) throw new Error("User email not available in token");
    logStep("User authenticated", { userId });

    // Create a user-like object for compatibility below
    const user = { id: userId, email: userEmail };

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      // No Stripe customer found by email — check for one-time payment via checkout sessions
      // This handles cases where Stripe didn't create a customer (guest checkout)
      logStep("No customer found by email, checking checkout sessions by client_reference_id");
      
      const checkoutSessions = await stripe.checkout.sessions.list({
        limit: 20,
      });
      
      const userSession = checkoutSessions.data.find(s => 
        s.client_reference_id === user.id && 
        s.payment_status === "paid" &&
        s.metadata?.is_lifetime === "true"
      );
      
      if (userSession) {
        const lifetimeTier = userSession.metadata?.tier || "pro";
        logStep("Found lifetime purchase via client_reference_id", { sessionId: userSession.id, tier: lifetimeTier });
        
        await supabaseClient
          .from('profiles')
          .update({ 
            subscription_tier: lifetimeTier,
            trial_ends_at: null,
            subscription_started_at: userSession.created 
              ? new Date(userSession.created * 1000).toISOString() 
              : new Date().toISOString()
          })
          .eq('id', user.id);
        
        return new Response(JSON.stringify({
          subscribed: true,
          tier: lifetimeTier,
          subscription_end: null,
          is_lifetime: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // Check if user has a manually-assigned tier (e.g. admin accounts)
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();
      
      const currentTier = profile?.subscription_tier || 'free';
      
      if (currentTier !== 'free') {
        logStep("No Stripe customer but user has manual tier, preserving", { tier: currentTier });
        return new Response(JSON.stringify({ 
          subscribed: true, 
          tier: currentTier,
          subscription_end: null 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      logStep("No customer found, returning free tier");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        tier: 'free',
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active OR trialing subscriptions (Pro tier includes 14-day trial)
    logStep("Fetching active/trialing subscriptions");
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });
    
    // Combine: prefer active over trialing
    const subscriptions = activeSubscriptions.data.length > 0 ? activeSubscriptions : trialingSubscriptions;
    logStep("Subscriptions fetched", { active: activeSubscriptions.data.length, trialing: trialingSubscriptions.data.length });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier = "free";
    let subscriptionEnd: string | null = null;
    let subscriptionId: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = safeTimestampToISO(subscription.current_period_end);
      subscriptionId = subscription.id;
      logStep("Active subscription found", { subscriptionId, endDate: subscriptionEnd });
      
      const productId = subscription.items.data[0]?.price?.product as string;
      tier = PRODUCT_TO_TIER[productId] || "pro";
      logStep("Determined subscription tier", { productId, tier });
      
      // Update profile with active subscription tier
      try {
        const updateData: { subscription_tier: string; subscription_started_at?: string; trial_ends_at?: null } = { 
          subscription_tier: tier,
          trial_ends_at: null
        };
        
        const startDate = safeTimestampToISO(subscription.start_date) || 
                          safeTimestampToISO(subscription.created);
        if (startDate) {
          updateData.subscription_started_at = startDate;
        }
        
        logStep("Updating profile", updateData);
        await supabaseClient
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);
        logStep("Profile updated successfully");
      } catch (updateError) {
        logStep("Profile update failed, continuing", { error: String(updateError) });
      }
    } else {
      // Check for one-time lifetime purchases via checkout sessions
      logStep("Checking for lifetime purchases");
      const checkoutSessions = await stripe.checkout.sessions.list({
        customer: customerId,
        status: "complete",
        limit: 10,
      });
      
      const lifetimePurchase = checkoutSessions.data.find(session => 
        session.metadata?.is_lifetime === "true" && session.payment_status === "paid"
      );
      
      if (lifetimePurchase) {
        tier = lifetimePurchase.metadata?.tier || "pro";
        logStep("Lifetime purchase found", { sessionId: lifetimePurchase.id, tier });
        
        await supabaseClient
          .from('profiles')
          .update({ 
            subscription_tier: tier,
            trial_ends_at: null,
            subscription_started_at: lifetimePurchase.created 
              ? new Date(lifetimePurchase.created * 1000).toISOString() 
              : new Date().toISOString()
          })
          .eq('id', user.id);
        
        logStep("Returning response", { subscribed: true, tier, lifetime: true });
        return new Response(JSON.stringify({
          subscribed: true,
          tier,
          subscription_end: null, // lifetime = no end
          subscription_id: null,
          is_lifetime: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      logStep("No active subscription found, checking for canceled");
      
      // Check for canceled subscriptions to see if they still have access
      const canceledSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "canceled",
        limit: 1,
      });
      logStep("Canceled subscriptions fetched", { count: canceledSubs.data.length });
      
      const pastDueSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "past_due",
        limit: 1,
      });
      logStep("Past due subscriptions fetched", { count: pastDueSubs.data.length });

      if (pastDueSubs.data.length > 0) {
        const pastDueSub = pastDueSubs.data[0];
        subscriptionEnd = safeTimestampToISO(pastDueSub.current_period_end);
        const productId = pastDueSub.items.data[0]?.price?.product as string;
        tier = PRODUCT_TO_TIER[productId] || "pro";
        logStep("Past due subscription found", { subscriptionId: pastDueSub.id, endDate: subscriptionEnd, tier });
        
        await supabaseClient
          .from('profiles')
          .update({ subscription_tier: tier })
          .eq('id', user.id);
      } else if (canceledSubs.data.length > 0) {
        const canceledSub = canceledSubs.data[0];
        const endTimestamp = canceledSub.current_period_end;
        
        if (endTimestamp && endTimestamp * 1000 > Date.now()) {
          subscriptionEnd = safeTimestampToISO(endTimestamp);
          const productId = canceledSub.items.data[0]?.price?.product as string;
          tier = PRODUCT_TO_TIER[productId] || "pro";
          logStep("Canceled subscription still active until", { endDate: subscriptionEnd, tier });
          
          await supabaseClient
            .from('profiles')
            .update({ subscription_tier: tier })
            .eq('id', user.id);
        } else {
          logStep("Canceled subscription expired, downgrading to free");
          await supabaseClient
            .from('profiles')
            .update({ 
              subscription_tier: 'free',
              subscription_started_at: null 
            })
            .eq('id', user.id);
        }
      } else {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('trial_ends_at, subscription_tier')
          .eq('id', user.id)
          .single();
        
        if (profile?.trial_ends_at && new Date(profile.trial_ends_at) < new Date()) {
          logStep("Trial expired without subscription, downgrading to free");
          await supabaseClient
            .from('profiles')
            .update({ 
              subscription_tier: 'free',
              trial_ends_at: null 
            })
            .eq('id', user.id);
        } else if (profile?.subscription_tier !== 'free') {
          logStep("No active subscription found, downgrading to free");
          await supabaseClient
            .from('profiles')
            .update({ 
              subscription_tier: 'free',
              subscription_started_at: null 
            })
            .eq('id', user.id);
        }
      }
    }

    logStep("Returning response", { subscribed: hasActiveSub, tier });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      subscription_end: subscriptionEnd,
      subscription_id: subscriptionId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
