import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Stripe product/price mapping - Monthly and Annual (Pro tier only)
const STRIPE_PRICES = {
  pro_monthly: "price_1SxOZeDO3m8kHfnyj9TKEhus", // £10/month
  pro_annual: "price_1SxOZuDO3m8kHfnytJtNcnGP", // £96/year (£8/month)
};

// Welcome Launch lifetime deal
const PROMO_PRICES: Record<string, { priceId: string; mode: "payment" | "subscription" }> = {
  WELCOMELAUNCH: { priceId: "price_1Syr9hDO3m8kHfnyOYJzV31b", mode: "payment" },
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

    const { tier, isAnnual, promoCode } = await req.json();
    logStep("Requested tier", { tier, isAnnual, promoCode });

    // Check if this is a promo code purchase
    const upperPromo = promoCode ? promoCode.toUpperCase().trim() : null;
    const promoConfig = upperPromo ? PROMO_PRICES[upperPromo] : null;

    // Validate promo code usage limits from DB
    if (upperPromo) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: dbPromo } = await serviceClient
        .from('promo_codes')
        .select('current_uses, max_uses, is_active')
        .eq('code', upperPromo)
        .single();
      
      if (dbPromo) {
        if (!dbPromo.is_active) {
          throw new Error("This promo code is no longer active");
        }
        if (dbPromo.max_uses && (dbPromo.current_uses || 0) >= dbPromo.max_uses) {
          throw new Error("This promo code has reached its maximum number of uses");
        }
      }
    }

    let priceId: string;
    let checkoutMode: "payment" | "subscription" = "subscription";
    let baseTier = tier;

    if (promoConfig) {
      // Promo code lifetime deal
      priceId = promoConfig.priceId;
      checkoutMode = promoConfig.mode;
      baseTier = "pro";
      logStep("Using promo code pricing", { promoCode: upperPromo, priceId, mode: checkoutMode });
    } else {
      // Standard subscription flow
      const billingPeriod = isAnnual ? "annual" : "monthly";
      const priceKey = `${tier}_${billingPeriod}` as keyof typeof STRIPE_PRICES;
      
      if (!tier || !STRIPE_PRICES[priceKey]) {
        throw new Error(`Invalid tier or billing period: ${tier}, ${billingPeriod}`);
      }
      priceId = STRIPE_PRICES[priceKey];
      baseTier = TIER_TO_BASE[priceKey];
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    
    // Use getClaims for signing-keys compatibility
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) throw new Error(`Authentication error: ${claimsError?.message || 'Invalid token'}`);
    
    const user = { id: claims.claims.sub as string, email: claims.claims.email as string };
    if (!user.email) throw new Error("User not authenticated or email not available");
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

    logStep("Creating checkout session", { priceId, baseTier, mode: checkoutMode });

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
      mode: checkoutMode,
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/pricing?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        tier: baseTier,
        promo_code: upperPromo || "",
        is_lifetime: promoConfig ? "true" : "false",
      },
    };

    // Add 14-day free trial for standard Pro subscriptions only (not promo)
    if (!promoConfig && baseTier === "pro") {
      sessionParams.subscription_data = {
        trial_period_days: 14,
      };
      logStep("Added 14-day trial for Pro tier");
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id });

    // Track promo code usage in DB
    if (upperPromo) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      // Get promo code record
      const { data: promoRecord } = await serviceClient
        .from('promo_codes')
        .select('id, current_uses, max_uses')
        .eq('code', upperPromo)
        .single();
      
      if (promoRecord) {
        // Check if max uses exceeded
        if (promoRecord.max_uses && (promoRecord.current_uses || 0) >= promoRecord.max_uses) {
          logStep("Promo code max uses reached", { code: upperPromo });
          // Still allow checkout but log warning
        }
        
        // Record redemption
        await serviceClient.from('promo_code_redemptions').insert({
          promo_code_id: promoRecord.id,
          user_id: user.id,
        });
        
        // Increment current_uses
        await serviceClient
          .from('promo_codes')
          .update({ current_uses: (promoRecord.current_uses || 0) + 1 })
          .eq('id', promoRecord.id);
        
        logStep("Promo code redemption recorded", { code: upperPromo, uses: (promoRecord.current_uses || 0) + 1 });
      }
    }

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
