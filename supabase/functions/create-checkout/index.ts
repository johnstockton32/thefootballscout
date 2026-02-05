import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Stripe product/price mapping - Monthly and Annual (Pro tier only)
const STRIPE_PRICES = {
  pro_monthly: "price_1SxOZeDO3m8kHfnyj9TKEhus", // £10/month
  pro_annual: "price_1SxOZuDO3m8kHfnytJtNcnGP", // £96/year (£8/month)
};

// Map tier keys to base tier names for profile updates
const TIER_TO_BASE: Record<string, string> = {
  pro_monthly: "pro",
  pro_annual: "pro",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Get origin with fallback for when invoked via supabase.functions.invoke
    let origin = req.headers.get("origin");
    
    if (!origin) {
      const referer = req.headers.get("referer");
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          origin = refererUrl.origin;
        } catch {
          origin = null;
        }
      }
    }
    
    // Final fallback to production URL
    if (!origin) {
      origin = "https://thefootballscout.lovable.app";
    }
    
    logStep("Origin determined", { origin });

    const { tier, isAnnual } = await req.json();
    logStep("Requested tier", { tier, isAnnual });

    // Construct the price key based on tier and billing period
    const billingPeriod = isAnnual ? "annual" : "monthly";
    const priceKey = `${tier}_${billingPeriod}` as keyof typeof STRIPE_PRICES;
    
    if (!tier || !STRIPE_PRICES[priceKey]) {
      throw new Error(`Invalid tier or billing period: ${tier}, ${billingPeriod}`);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const priceId = STRIPE_PRICES[priceKey];
    const baseTier = TIER_TO_BASE[priceKey];
    const isPro = baseTier === "pro";
    logStep("Creating checkout session", { priceId, priceKey, baseTier, hasTrial: isPro });

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/pricing?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        tier: baseTier,
        billing_period: billingPeriod,
      },
    };

    // Add 14-day free trial for all Pro subscriptions (monthly and annual)
    if (isPro) {
      sessionParams.subscription_data = {
        trial_period_days: 14,
      };
      logStep("Added 14-day trial for Pro tier");
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
