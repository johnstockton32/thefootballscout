import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const LICENSES_PER_PACK = 10;

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUserClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUserClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestingUserId = claimsData.claims.sub as string;
    console.log("Verifying license purchase for user:", requestingUserId);

    // Parse request body
    const { teamId } = await req.json();
    
    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Team ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns this team
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("id, owner_id, license_count")
      .eq("id", teamId)
      .eq("owner_id", requestingUserId)
      .single();

    if (teamError || !team) {
      return new Response(
        JSON.stringify({ error: "Team not found or you are not the owner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email to check Stripe payments
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", requestingUserId)
      .single();

    if (!userProfile?.email) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({ email: userProfile.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({ error: "No payment record found", verified: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerId = customers.data[0].id;

    // Check for recent successful checkout sessions for this team
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 10,
    });

    // Find a completed session for this team that hasn't been processed
    type CheckoutSession = typeof sessions.data[number];
    const validSession = sessions.data.find((session: CheckoutSession) => 
      session.payment_status === "paid" &&
      session.metadata?.team_id === teamId &&
      session.metadata?.licenses_to_add
    );

    if (!validSession) {
      return new Response(
        JSON.stringify({ verified: false, message: "No pending license purchase found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const licensesToAdd = parseInt(validSession.metadata!.licenses_to_add, 10) || LICENSES_PER_PACK;

    // Use atomic RPC function to add licenses with idempotency check
    // This prevents double redemption by tracking processed sessions
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('add_team_licenses', {
      p_team_id: teamId,
      p_licenses_to_add: licensesToAdd,
      p_stripe_session_id: validSession.id,
      p_processed_by: requestingUserId
    });

    if (rpcError) {
      console.error("Error calling add_team_licenses RPC:", rpcError);
      return new Response(
        JSON.stringify({ error: "Failed to process license purchase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the RPC returned an error (already processed)
    if (!rpcResult.success) {
      console.log("License purchase already processed:", rpcResult.error);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: rpcResult.error || "This purchase has already been processed" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updated team ${teamId} licenses: ${rpcResult.previous_count} -> ${rpcResult.new_count}`);

    return new Response(
      JSON.stringify({ 
        verified: true, 
        previousCount: rpcResult.previous_count,
        newCount: rpcResult.new_count,
        added: rpcResult.added
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
