import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
      },
    });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey) {
    logStep("ERROR", { message: "STRIPE_SECRET_KEY not set" });
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let event: Stripe.Event;

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!webhookSecret) {
      logStep("ERROR", { message: "STRIPE_WEBHOOK_SECRET not set" });
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500 });
    }
    if (!signature) {
      logStep("ERROR", { message: "Missing stripe-signature header" });
      return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook signature verified");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Webhook signature verification failed", { message: msg });
    return new Response(JSON.stringify({ error: `Webhook Error: ${msg}` }), { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id || session.client_reference_id;
        const tier = session.metadata?.tier || "pro";
        const promoCode = session.metadata?.promo_code;
        const isLifetime = session.metadata?.is_lifetime === "true";

        logStep("Checkout completed", { userId, tier, promoCode, isLifetime, mode: session.mode });

        if (!userId) {
          logStep("ERROR: No user_id in session metadata");
          break;
        }

        // Update profile subscription tier
        const { error: updateError } = await serviceClient
          .from("profiles")
          .update({
            subscription_tier: tier,
            subscription_started_at: new Date().toISOString(),
            trial_ends_at: null, // Clear trial since they've paid/started subscription
          })
          .eq("id", userId);

        if (updateError) {
          logStep("ERROR updating profile", { error: updateError.message });
        } else {
          logStep("Profile updated to tier", { userId, tier });
        }

        // Record promo code usage AFTER successful payment (moved from create-checkout)
        if (promoCode) {
          const { data: promoRecord } = await serviceClient
            .from("promo_codes")
            .select("id, current_uses")
            .eq("code", promoCode)
            .single();

          if (promoRecord) {
            await serviceClient.from("promo_code_redemptions").insert({
              promo_code_id: promoRecord.id,
              user_id: userId,
            });

            await serviceClient
              .from("promo_codes")
              .update({ current_uses: (promoRecord.current_uses || 0) + 1 })
              .eq("id", promoRecord.id);

            logStep("Promo code redeemed after payment", { code: promoCode });
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Look up user by Stripe customer email
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const email = (customer as Stripe.Customer).email;
        if (!email) break;

        const { data: profile } = await serviceClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        if (profile) {
          await serviceClient
            .from("profiles")
            .update({ subscription_tier: "pro" })
            .eq("id", profile.id);

          logStep("Invoice paid - subscription confirmed", { userId: profile.id });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const email = (customer as Stripe.Customer).email;
        if (!email) break;

        const { data: profile } = await serviceClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        if (profile) {
          await serviceClient
            .from("profiles")
            .update({
              subscription_tier: "free",
              subscription_started_at: null,
              trial_ends_at: null,
            })
            .eq("id", profile.id);

          logStep("Subscription cancelled - downgraded to free", { userId: profile.id });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const email = (customer as Stripe.Customer).email;
        if (!email) break;

        const { data: profile } = await serviceClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        if (profile) {
          if (status === "active" || status === "trialing") {
            await serviceClient
              .from("profiles")
              .update({ subscription_tier: "pro" })
              .eq("id", profile.id);
            logStep("Subscription updated - active/trialing", { userId: profile.id, status });
          } else if (status === "past_due" || status === "unpaid") {
            logStep("Subscription past due", { userId: profile.id, status });
            // Optionally downgrade or notify
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
