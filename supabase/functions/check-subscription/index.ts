import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Map Stripe product IDs to subscription tiers (monthly and annual products)
const PRODUCT_TO_TIER: Record<string, string> = {
  "prod_Tosg17axMRBxhO": "pro",     // Pro Monthly
  "prod_Tou2sHCFkvlj2D": "pro",     // Pro Annual
  "prod_TosgIYUQYqmIWk": "team",    // Team Monthly
  "prod_Tou2uJNSTQ3yeF": "team",    // Team Annual
};

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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      
      // Update profile to free tier
      await supabaseClient
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', user.id);
        
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

    logStep("Fetching active subscriptions");
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    logStep("Active subscriptions fetched", { count: subscriptions.data.length });

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
      tier = PRODUCT_TO_TIER[productId] || "free";
      logStep("Determined subscription tier", { productId, tier });
      
      // Update profile with active subscription tier
      const startDate = safeTimestampToISO(subscription.start_date) || 
                        safeTimestampToISO(subscription.created) || 
                        new Date().toISOString();
      
      await supabaseClient
        .from('profiles')
        .update({ 
          subscription_tier: tier,
          subscription_started_at: startDate
        })
        .eq('id', user.id);
    } else {
      logStep("No active subscription found, checking for canceled");
      
      // Check for canceled subscriptions to see if they still have access
      const canceledSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "canceled",
        limit: 1,
      });
      logStep("Canceled subscriptions fetched", { count: canceledSubs.data.length });
      
      if (canceledSubs.data.length > 0) {
        const canceledSub = canceledSubs.data[0];
        const endTimestamp = canceledSub.current_period_end;
        
        if (endTimestamp && endTimestamp * 1000 > Date.now()) {
          // Still has access until end of period
          subscriptionEnd = safeTimestampToISO(endTimestamp);
          const productId = canceledSub.items.data[0]?.price?.product as string;
          tier = PRODUCT_TO_TIER[productId] || "free";
          logStep("Canceled subscription still active until", { endDate: subscriptionEnd, tier });
        } else {
          logStep("Canceled subscription expired, updating to free");
          // Update to free tier
          await supabaseClient
            .from('profiles')
            .update({ subscription_tier: 'free' })
            .eq('id', user.id);
        }
      } else {
        logStep("No canceled subscriptions, updating to free");
        // Update to free tier
        await supabaseClient
          .from('profiles')
          .update({ subscription_tier: 'free' })
          .eq('id', user.id);
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
