import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for deletions
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    console.log(`Starting account deletion for user: ${userId}`);

    // Delete in order of dependencies using service role
    const deletionSteps = [
      { table: 'video_clips', column: 'user_id' },
      { table: 'ai_insights', column: 'user_id' },
      { table: 'watchlist_players', column: 'watchlist_id', subquery: true },
      { table: 'watchlists', column: 'user_id' },
      { table: 'push_subscriptions', column: 'user_id' },
      { table: 'report_templates', column: 'user_id' },
      { table: 'custom_attribute_weights', column: 'user_id' },
      { table: 'branding_settings', column: 'user_id' },
      { table: 'saved_searches', column: 'user_id' },
      { table: 'promo_code_redemptions', column: 'user_id' },
      { table: 'scouting_reports', column: 'scout_id' },
      { table: 'players', column: 'scout_id' },
      { table: 'user_roles', column: 'user_id' },
    ];

    // Handle watchlist_players specially (needs to get watchlist IDs first)
    const { data: watchlists } = await supabaseAdmin
      .from('watchlists')
      .select('id')
      .eq('user_id', userId);

    if (watchlists && watchlists.length > 0) {
      const watchlistIds = watchlists.map(w => w.id);
      await supabaseAdmin
        .from('watchlist_players')
        .delete()
        .in('watchlist_id', watchlistIds);
    }

    // Delete from all other tables
    for (const step of deletionSteps) {
      if (step.subquery) continue; // Already handled above
      
      const { error } = await supabaseAdmin
        .from(step.table)
        .delete()
        .eq(step.column, userId);
      
      if (error) {
        console.log(`Warning: Could not delete from ${step.table}: ${error.message}`);
      } else {
        console.log(`Deleted from ${step.table}`);
      }
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error(`Error deleting profile: ${profileError.message}`);
    }

    // Finally delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error(`Error deleting auth user: ${deleteUserError.message}`);
      return new Response(
        JSON.stringify({ error: "Failed to delete account. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in delete-account function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
